[CmdletBinding(SupportsShouldProcess = $true)]
param(
    # 只在希望脚本先重新打包时使用；默认直接使用固定 PNG。
    [switch]$BuildFirst,

    # 完成后打开酒馆网页。已有页面是否自动切换由浏览器决定。
    [switch]$OpenBrowser,

    # 是否一并删除旧角色卡的聊天文件；默认保留聊天记录。
    [switch]$DeleteChats,

    # 方便本地酒馆端口变化时复用脚本。
    [string]$BaseUrl = 'http://127.0.0.1:8000',

    # 防止本地接口异常时无限等待。
    [ValidateRange(1, 120)][int]$ApiTimeoutSec = 15,

    # 角色卡导入时酒馆可能给同名头像追加数字后缀；只探测这一组固定候选名。
    [ValidateRange(0, 256)][int]$MaxAvatarSuffixProbe = 32
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BaseUrl = $BaseUrl.TrimEnd('/')
$script:ApiTimeoutSec = $ApiTimeoutSec
$script:MaxAvatarSuffixProbe = $MaxAvatarSuffixProbe
$CardName = '人间修订中'
$WorldbookName = '人间修订中'
$CardFileName = '人间修订中.png'
$CardPath = Join-Path $ProjectRoot 'src\人间修订中\人间修订中.png'
$BackupDirectory = Join-Path $ProjectRoot '.codex\人间修订中-重装'
$ExpectedRegexNames = @(
    '[不发送]去除变量更新',
    '[折叠]变量更新中',
    '[折叠]完整变量更新',
    '[界面]状态栏',
    '[界面]世界配置',
    '[不发送]世界配置标签'
)
$ExpectedHelperNames = @('mvu', '变量结构')

function Write-Status {
    param([Parameter(Mandatory = $true)][string]$Message)
    Write-Host "[$CardName] $Message" -ForegroundColor Cyan
}

function Get-PropertyValue {
    param(
        [AllowNull()][object]$Object,
        [Parameter(Mandatory = $true)][string]$Name,
        [AllowNull()][object]$Default = $null
    )

    if ($null -ne $Object) {
        $property = $Object.PSObject.Properties[$Name]
        if ($null -ne $property -and $null -ne $property.Value) {
            return $property.Value
        }
    }

    return $Default
}

function Expand-ApiArray {
    param([AllowNull()][object]$Value)

    if ($null -eq $Value) {
        return
    }

    if ($Value -is [Array]) {
        foreach ($item in $Value) {
            if ($item -is [Array]) {
                foreach ($nestedItem in $item) {
                    $nestedItem
                }
            } else {
                $item
            }
        }
    } else {
        $Value
    }
}

function Invoke-StJson {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [AllowNull()][object]$Body = $null,
        [switch]$AllowNotFound
    )

    $uri = "$($script:BaseUrl)$Path"
    $requestBody = $null
    if ($PSBoundParameters.ContainsKey('Body')) {
        $requestBody = $Body | ConvertTo-Json -Depth 100 -Compress
    }

    $oldWhatIfPreference = $WhatIfPreference
    try {
        # API reads are required to discover the current card/worldbook state;
        # only the later ShouldProcess-gated mutations remain in preview mode.
        $WhatIfPreference = $false
        try {
            $response = Invoke-WebRequest `
                -Uri $uri `
                -Method Post `
                -WebSession $script:WebSession `
                -Headers $script:StHeaders `
                -Body $requestBody `
                -ContentType 'application/json; charset=utf-8' `
                -UseBasicParsing `
                -TimeoutSec $script:ApiTimeoutSec
        } catch {
            $statusCode = $null
            if ($null -ne $_.Exception.Response) {
                try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { }
            }
            if ($AllowNotFound -and $statusCode -eq 404) {
                return $null
            }
            throw "酒馆 API 请求失败 [$Path]: $($_.Exception.Message)"
        }
    } finally {
        $WhatIfPreference = $oldWhatIfPreference
    }

    if ([string]::IsNullOrWhiteSpace($response.Content)) {
        return $null
    }

    try {
        return $response.Content | ConvertFrom-Json
    } catch {
        # 删除/编辑接口可能返回纯文本 OK；调用方若需要结构化数据会在后续验收阶段报出具体问题。
        return $response.Content.Trim()
    }
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    Write-Status ("执行: {0} {1}" -f $Command, ($Arguments -join ' '))
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "命令失败，退出码=$LASTEXITCODE：$Command $($Arguments -join ' ')"
    }
}

function Test-TargetCharacter {
    param(
        [Parameter(Mandatory = $true)][object]$Character,
        [AllowEmptyString()][string]$AvatarOverride = ''
    )

    $data = Get-PropertyValue $Character 'data' $null
    $extensions = Get-PropertyValue $data 'extensions' $null
    $book = Get-PropertyValue $data 'character_book' $null
    $avatarValue = if ([string]::IsNullOrWhiteSpace($AvatarOverride)) {
        [string](Get-PropertyValue $Character 'avatar' '')
    } else {
        $AvatarOverride
    }
    $avatar = [IO.Path]::GetFileName($avatarValue)
    $world = [string](Get-PropertyValue $extensions 'world' '')
    $bookName = [string](Get-PropertyValue $book 'name' '')
    $nameMatches = [string](Get-PropertyValue $Character 'name' '') -eq $script:CardName
    $avatarMatches = $avatar -match '^人间修订中\d*\.png$'

    return [bool]($nameMatches -and ($avatarMatches -or $world -eq $script:WorldbookName -or $bookName -eq $script:WorldbookName))
}

function Get-TargetCharacterRecords {
    $records = @()
    $baseName = [IO.Path]::GetFileNameWithoutExtension($script:CardFileName)

    for ($suffix = 0; $suffix -le $script:MaxAvatarSuffixProbe; $suffix++) {
        $avatar = if ($suffix -eq 0) {
            $script:CardFileName
        } else {
            "$baseName$suffix.png"
        }

        $character = Invoke-StJson '/api/characters/get' @{ avatar_url = $avatar } -AllowNotFound
        if ($null -eq $character) {
            continue
        }

        if (Test-TargetCharacter -Character $character -AvatarOverride $avatar) {
            $records += [pscustomobject]@{
                avatar = $avatar
                character = $character
            }
        }
    }

    $lastAvatar = if ($script:MaxAvatarSuffixProbe -eq 0) {
        $script:CardFileName
    } else {
        "$baseName$($script:MaxAvatarSuffixProbe).png"
    }
    if (@($records | Where-Object { $_.avatar -eq $lastAvatar }).Count -gt 0) {
        throw "角色卡候选探测已达到 $lastAvatar；请提高 -MaxAvatarSuffixProbe 后再重装。"
    }

    return @($records)
}

function Convert-CharacterBookToWorldInfo {
    param([Parameter(Mandatory = $true)][object]$Book)

    $resultEntries = [ordered]@{}
    $bookEntries = @(Get-PropertyValue $Book 'entries' @())

    for ($index = 0; $index -lt $bookEntries.Count; $index++) {
        $entry = $bookEntries[$index]
        $entryExtensions = Get-PropertyValue $entry 'extensions' $null
        $entryId = Get-PropertyValue $entry 'id' $index
        $position = Get-PropertyValue $entryExtensions 'position' $null
        if ($null -eq $position) {
            $position = if ([string](Get-PropertyValue $entry 'position' '') -eq 'before_char') { 0 } else { 4 }
        }

        $comment = [string](Get-PropertyValue $entry 'comment' '')
        $entryKeys = @(Get-PropertyValue $entry 'keys' @())
        $secondaryKeys = @(Get-PropertyValue $entry 'secondary_keys' @())

        $converted = [ordered]@{
            uid = $entryId
            key = $entryKeys
            keysecondary = $secondaryKeys
            comment = $comment
            content = [string](Get-PropertyValue $entry 'content' '')
            constant = [bool](Get-PropertyValue $entry 'constant' $false)
            selective = [bool](Get-PropertyValue $entry 'selective' $false)
            order = [int](Get-PropertyValue $entry 'insertion_order' 100)
            position = [int]$position
            excludeRecursion = [bool](Get-PropertyValue $entryExtensions 'exclude_recursion' $false)
            preventRecursion = [bool](Get-PropertyValue $entryExtensions 'prevent_recursion' $false)
            delayUntilRecursion = [bool](Get-PropertyValue $entryExtensions 'delay_until_recursion' $false)
            disable = -not [bool](Get-PropertyValue $entry 'enabled' $true)
            addMemo = $comment.Length -gt 0
            displayIndex = [int](Get-PropertyValue $entryExtensions 'display_index' $index)
            probability = [int](Get-PropertyValue $entryExtensions 'probability' 100)
            useProbability = [bool](Get-PropertyValue $entryExtensions 'useProbability' $true)
            depth = [int](Get-PropertyValue $entryExtensions 'depth' 4)
            selectiveLogic = [int](Get-PropertyValue $entryExtensions 'selectiveLogic' 0)
            outletName = [string](Get-PropertyValue $entryExtensions 'outlet_name' '')
            group = [string](Get-PropertyValue $entryExtensions 'group' '')
            groupOverride = [bool](Get-PropertyValue $entryExtensions 'group_override' $false)
            groupWeight = [int](Get-PropertyValue $entryExtensions 'group_weight' 100)
            scanDepth = Get-PropertyValue $entryExtensions 'scan_depth' $null
            caseSensitive = Get-PropertyValue $entryExtensions 'case_sensitive' $null
            matchWholeWords = Get-PropertyValue $entryExtensions 'match_whole_words' $null
            useGroupScoring = Get-PropertyValue $entryExtensions 'use_group_scoring' $null
            automationId = [string](Get-PropertyValue $entryExtensions 'automation_id' '')
            role = [int](Get-PropertyValue $entryExtensions 'role' 0)
            vectorized = [bool](Get-PropertyValue $entryExtensions 'vectorized' $false)
            sticky = Get-PropertyValue $entryExtensions 'sticky' $null
            cooldown = Get-PropertyValue $entryExtensions 'cooldown' $null
            delay = Get-PropertyValue $entryExtensions 'delay' $null
            matchPersonaDescription = [bool](Get-PropertyValue $entryExtensions 'match_persona_description' $false)
            matchCharacterDescription = [bool](Get-PropertyValue $entryExtensions 'match_character_description' $false)
            matchCharacterPersonality = [bool](Get-PropertyValue $entryExtensions 'match_character_personality' $false)
            matchCharacterDepthPrompt = [bool](Get-PropertyValue $entryExtensions 'match_character_depth_prompt' $false)
            matchScenario = [bool](Get-PropertyValue $entryExtensions 'match_scenario' $false)
            matchCreatorNotes = [bool](Get-PropertyValue $entryExtensions 'match_creator_notes' $false)
            extensions = if ($null -eq $entryExtensions) { @{} } else { $entryExtensions }
            triggers = @(Get-PropertyValue $entryExtensions 'triggers' @())
            ignoreBudget = [bool](Get-PropertyValue $entryExtensions 'ignore_budget' $false)
        }

        $resultEntries[[string]$entryId] = $converted
    }

    return [ordered]@{
        entries = $resultEntries
        originalData = $Book
    }
}

function Invoke-CharacterImport {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$PreservedName
    )

    Add-Type -AssemblyName System.Net.Http
    $baseUri = [Uri]($script:BaseUrl + '/')
    $cookieContainer = New-Object System.Net.CookieContainer
    foreach ($cookie in $script:WebSession.Cookies.GetCookies($baseUri)) {
        try {
            $cookieContainer.Add($baseUri, $cookie)
        } catch {
            # 同名 cookie 由 CookieContainer 自动处理；不影响当前会话。
        }
    }

    $handler = New-Object System.Net.Http.HttpClientHandler
    $handler.UseCookies = $true
    $handler.CookieContainer = $cookieContainer
    $client = New-Object System.Net.Http.HttpClient($handler)
    $client.Timeout = [TimeSpan]::FromSeconds($script:ApiTimeoutSec)
    $client.DefaultRequestHeaders.Add('X-CSRF-Token', $script:CsrfToken)
    $multipart = New-Object System.Net.Http.MultipartFormDataContent
    $stream = $null

    try {
        $stream = [IO.File]::OpenRead($Path)
        $fileContent = New-Object System.Net.Http.StreamContent($stream)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('image/png')
        $multipart.Add($fileContent, 'avatar', [IO.Path]::GetFileName($Path))
        $multipart.Add((New-Object System.Net.Http.StringContent('png')), 'file_type')
        $multipart.Add((New-Object System.Net.Http.StringContent([Environment]::UserName)), 'user_name')
        # 固定名称：即使酒馆里残留了同名头像文件，也优先覆盖这个文件名。
        $multipart.Add((New-Object System.Net.Http.StringContent($PreservedName)), 'preserved_name')

        $response = $client.PostAsync("$($script:BaseUrl)/api/characters/import", $multipart).GetAwaiter().GetResult()
        $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) {
            throw "角色卡导入失败：HTTP $([int]$response.StatusCode) $($response.ReasonPhrase) $content"
        }

        if ([string]::IsNullOrWhiteSpace($content)) {
            throw '角色卡导入接口返回空内容。'
        }

        return $content | ConvertFrom-Json
    } finally {
        if ($null -ne $stream) { $stream.Dispose() }
        if ($null -ne $multipart) { $multipart.Dispose() }
        if ($null -ne $client) { $client.Dispose() }
        if ($null -ne $handler) { $handler.Dispose() }
    }
}

Write-Status "当前工作目录=$ProjectRoot"
Write-Status "固定卡包=$CardPath"

if ($BuildFirst) {
    if ($WhatIfPreference) {
        Write-Status 'WhatIf：跳过 pnpm build 与 bundle。'
    } else {
        $pnpmCommand = if (Get-Command pnpm.cmd -ErrorAction SilentlyContinue) { 'pnpm.cmd' } else { 'pnpm' }
        Push-Location $ProjectRoot
        try {
            Invoke-CheckedCommand $pnpmCommand @('build')
            Invoke-CheckedCommand $pnpmCommand @('sync', 'bundle', $CardName)
        } finally {
            Pop-Location
        }
    }
}

if (-not (Test-Path -LiteralPath $CardPath -PathType Leaf)) {
    throw "固定角色卡 PNG 不存在：$CardPath"
}

$oldWhatIfPreference = $WhatIfPreference
try {
    # Get-Item/Get-FileHash also honor WhatIfPreference on this PowerShell build;
    # compute the read-only card fingerprint with preview mode locally suspended.
    $WhatIfPreference = $false
    $cardFile = Get-Item -LiteralPath $CardPath
    $cardHash = (Get-FileHash -LiteralPath $CardPath -Algorithm SHA256).Hash
} finally {
    $WhatIfPreference = $oldWhatIfPreference
}
Write-Status ("卡包大小={0} bytes; SHA256={1}" -f $cardFile.Length, $cardHash)

try {
    $script:WebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $oldWhatIfPreference = $WhatIfPreference
    try {
        # CSRF discovery is a read-only prerequisite for both normal and preview runs.
        $WhatIfPreference = $false
        $csrfResponse = Invoke-WebRequest -Uri "$BaseUrl/csrf-token" -WebSession $script:WebSession -UseBasicParsing -TimeoutSec $script:ApiTimeoutSec
    } finally {
        $WhatIfPreference = $oldWhatIfPreference
    }
    $csrfData = $csrfResponse.Content | ConvertFrom-Json
    $script:CsrfToken = [string]$csrfData.token
    if ([string]::IsNullOrWhiteSpace($script:CsrfToken)) {
        throw '没有获取到酒馆 CSRF token。'
    }
    $script:StHeaders = @{ 'X-CSRF-Token' = $script:CsrfToken; Accept = 'application/json' }

    $targetCharacters = @(Get-TargetCharacterRecords)
    $existingWorld = Invoke-StJson '/api/worldinfo/get' @{ name = $WorldbookName }
    $existingWorldEntryCount = if ($null -ne $existingWorld -and $null -ne $existingWorld.entries) {
        @($existingWorld.entries.PSObject.Properties).Count
    } else {
        0
    }
    $hasExistingWorld = $existingWorldEntryCount -gt 0

    Write-Status ("发现目标角色卡 {0} 张；世界书={1}；定向探测上限={2}" -f $targetCharacters.Count, $hasExistingWorld, $MaxAvatarSuffixProbe)

    if (-not $WhatIfPreference) {
        New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $backupPath = Join-Path $BackupDirectory "backup-$stamp.json"
        $snapshot = [ordered]@{
            created_at = (Get-Date).ToString('o')
            card_path = $CardPath
            card_sha256 = $cardHash
            characters = @($targetCharacters | ForEach-Object {
                $character = $_.character
                if ($null -eq $character.PSObject.Properties['avatar']) {
                    $character | Add-Member -NotePropertyName avatar -NotePropertyValue $_.avatar -Force
                }
                $character
            })
            worldbook = if ($hasExistingWorld) { $existingWorld } else { $null }
        }
        $snapshot | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $backupPath -Encoding UTF8
        Write-Status "已保存网页端重装前备份=$backupPath"
    }

    foreach ($record in $targetCharacters) {
        $avatar = [string]$record.avatar
        if ($PSCmdlet.ShouldProcess("角色卡 $avatar", "删除（聊天文件保留=$(-not $DeleteChats)）")) {
            Invoke-StJson '/api/characters/delete' @{ avatar_url = $avatar; delete_chats = [bool]$DeleteChats } | Out-Null
            Write-Status "已删除旧角色卡=$avatar"
        }
    }

    if ($hasExistingWorld -and $PSCmdlet.ShouldProcess("世界书 $WorldbookName", '删除旧版本')) {
        Invoke-StJson '/api/worldinfo/delete' @{ name = $WorldbookName } | Out-Null
        Write-Status "已删除旧世界书=$WorldbookName"
    }

    if ($WhatIfPreference) {
        Write-Status 'WhatIf 演练结束；没有写入酒馆。'
        return
    }

    Start-Sleep -Milliseconds 300
    $importResult = Invoke-CharacterImport -Path $CardPath -PreservedName $CardFileName
    if ([bool](Get-PropertyValue $importResult 'error' $false)) {
        throw "酒馆返回导入错误：$($importResult.error)"
    }

    $returnedFileName = [string](Get-PropertyValue $importResult 'file_name' '')
    if ([string]::IsNullOrWhiteSpace($returnedFileName)) {
        throw '角色卡导入结果缺少 file_name。'
    }
    $returnedAvatar = [IO.Path]::GetFileName($returnedFileName)
    if ([IO.Path]::GetExtension($returnedAvatar) -eq '') {
        $returnedAvatar += '.png'
    }
    Write-Status "角色卡已导入=$returnedAvatar"

    $finalCard = Invoke-StJson '/api/characters/get' @{ avatar_url = $returnedAvatar }
    if ($null -eq $finalCard) {
        throw "导入后读取角色卡失败：$returnedAvatar"
    }
    $finalData = Get-PropertyValue $finalCard 'data' $finalCard
    $finalExtensions = Get-PropertyValue $finalData 'extensions' $null
    $finalBook = Get-PropertyValue $finalData 'character_book' $null

    if ([string](Get-PropertyValue $finalData 'name' '') -ne $CardName) {
        throw '导入后的角色卡名称不匹配。'
    }
    if ([string](Get-PropertyValue $finalExtensions 'world' '') -ne $WorldbookName) {
        throw '导入后的角色卡世界书链接不匹配。'
    }

    $convertedWorld = Convert-CharacterBookToWorldInfo $finalBook
    Invoke-StJson '/api/worldinfo/edit' @{ name = $WorldbookName; data = $convertedWorld } | Out-Null
    Write-Status ("已重建世界书=$WorldbookName; entries=$(@(Get-PropertyValue $finalBook 'entries' @()).Count)")

    $matchingCharacters = @(Get-TargetCharacterRecords)
    if ($matchingCharacters.Count -ne 1) {
        throw "重装后目标角色卡数量=$($matchingCharacters.Count)，预期=1。"
    }

    $finalWorld = Invoke-StJson '/api/worldinfo/get' @{ name = $WorldbookName }
    $worldEntryCount = @($finalWorld.entries.PSObject.Properties).Count
    if ($worldEntryCount -lt 1) {
        throw '重装后世界书没有条目。'
    }

    $regexScripts = @(Get-PropertyValue $finalExtensions 'regex_scripts' @())
    $regexNames = @($regexScripts | ForEach-Object { [string](Get-PropertyValue $_ 'scriptName' '') })
    $sortedRegex = @($regexNames | Sort-Object) -join '|'
    $sortedExpectedRegex = @($ExpectedRegexNames | Sort-Object) -join '|'
    if ($sortedRegex -ne $sortedExpectedRegex -or @($regexScripts | Where-Object { [bool](Get-PropertyValue $_ 'disabled' $true) }).Count -ne 0) {
        throw '重装后角色卡正则数量、名称或启用状态不匹配。'
    }

    $helperScripts = @(Get-PropertyValue (Get-PropertyValue $finalExtensions 'tavern_helper' $null) 'scripts' @())
    $helperNames = @($helperScripts | ForEach-Object { [string](Get-PropertyValue $_ 'name' '') })
    $sortedHelpers = @($helperNames | Sort-Object) -join '|'
    $sortedExpectedHelpers = @($ExpectedHelperNames | Sort-Object) -join '|'
    if ($sortedHelpers -ne $sortedExpectedHelpers -or @($helperScripts | Where-Object { -not [bool](Get-PropertyValue $_ 'enabled' $false) }).Count -ne 0) {
        throw '重装后酒馆助手角色脚本数量、名称或启用状态不匹配。'
    }

    $result = [ordered]@{
        status = 'OK'
        card_name = [string](Get-PropertyValue $finalData 'name' '')
        card_avatar = $returnedAvatar
        card_sha256 = $cardHash
        worldbook = $WorldbookName
        worldbook_entries = $worldEntryCount
        regex_count = $regexScripts.Count
        helper_scripts = $helperNames
        backup_directory = $BackupDirectory
        note = '角色卡、世界书、角色正则和酒馆助手角色脚本已由同一脚本完成重装并验收。'
    }
    $result | ConvertTo-Json -Depth 20

    if ($OpenBrowser) {
        Start-Process "$BaseUrl/"
    }
} catch {
    Write-Error $_
    exit 1
}
