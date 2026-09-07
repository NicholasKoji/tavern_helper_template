// 来自用户认可的七套实验；FGH 使用第二版，仅去除场景绑定描述。
export const STYLE_PRESETS = [
  {
    id: 'A',
    label: 'A · 日漫 / 新海诚方向',
    summary: '细线条、清透色彩与柔和赛璐璐明暗的二维日漫人物。',
    prompt:
      'A refined Japanese 2D anime film still in the visual style of Makoto Shinkai films such as The Garden of Words, Your Name and Weathering with You. Focus on elegant adult female character drawing: thin precise colored contours, beautiful delicately drawn eyes, simplified refined nose and lips, coherent cel-shaded facial planes, finely grouped hair strands with luminous rim highlights. Restrained soft light bloom, clear airy colors, carefully painted light and gentle environmental reflections. Believable character proportions matching the scene description. Character and background share a harmonious cinematic palette. Keep it visibly hand-drawn 2D animation, not live action, 3D CG or painterly semi-realism.  Do not turn the shot into a landscape or shrink the woman.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'B1',
    label: 'B1 · 热血韩漫',
    summary: '锐利眼型、利落轮廓、强弱分明阴影的热血韩漫画法，不改变剧情题材。',
    prompt:
      'Premium Korean action-webtoon illustration, drawing on the sharp character design and polished rendering of Solo Leveling and Omniscient Readers Viewpoint. A striking adult female lead with sharp expressive almond eyes, precise lashes, refined angular facial contours, confident quiet presence and a clean expressive silhouette. Crisp tapered linework, strong but flattering cel-shadow shapes, controlled gradients, polished hair highlights, energetic clean silhouette and clearly articulated limbs. Attractive adult face, not exaggerated masculine anatomy. Apply this drawing language to the supplied scene. Do not add combat, powers, weapons or armor unless the scene calls for them.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'B2',
    label: 'B2 · 精致女性韩漫（附参考图）',
    summary: '精细眼睑与唇形、立体上色的女性韩漫画法，参考图仅控制画法。',
    prompt:
      'Refined Korean webtoon illustration in the visual drawing style of Domesticate The Housekeeper by SERIOUS. The attached banner is a STYLE reference only: study ONLY the adult woman on the far right, wearing a red high-neck top with long white hair. Transfer the eye and eyelid drawing, refined lips, facial contours, clean linework and dimensional color-shading language to the scene characters. Preserve the scene character identity, age, hair, body type, clothing, expression and action. Do not copy reference hair color, tan skin tone, red clothes, identity, banner layout or other characters. Beautiful polished 2D character illustration, not photography or CG.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'F',
    label: 'F · 抖音美颜网红',
    summary: '理想化真人网红美颜，协调五官、明亮眼神和精心妆发，非生活纪实。',
    prompt:
      'Douyin glamorous beauty-influencer aesthetic, deliberately idealized and strongly beauty-filtered live-action appearance, NOT documentary realism. An exceptionally beautiful mature East Asian influencer: luminous large almond eyes with lifted outer corners, precise eyeliner and fine curled lashes, beautifully arched brows, a refined small nose, soft sculpted oval face and delicate jawline, full softly glossy rose lips. Bright clear eyes and smooth luminous skin with flattering beauty retouching. Voluminous styled hair framing her face, polished peach-rose makeup that looks effortless but professionally designed. Preserve the explicit age and body design specified in the scene. Flattering beauty-camera rendering, luminous complexion, attractive facial proportions and gentle catchlights. No gritty pores, tired under-eye shadows, drab lighting, harsh nasolabial shadows or unstyled everyday appearance. Prioritize a striking beautiful face, not merely smoother skin on an average face.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'G',
    label: 'G · 精致轻奢美人',
    summary: '精雕五官与细腻妆发的轻奢美人，化妆品广告般精修完成度。',
    prompt:
      "Luxury beauty-editorial portrait aesthetic with a highly refined idealized East Asian leading-lady face, more meticulously art-directed than a casual influencer selfie. Exceptionally harmonious facial proportions: elegant elongated almond eyes, delicately shaped eyelids and lashes, refined straight nose, beautifully defined cupid's bow and satin rose lips, sculpted but soft cheekbones and graceful jaw. Sophisticated understated glamour makeup with precise taupe eye contour, delicate highlight and immaculate luminous satin skin; coiffed glossy dark waves, a few deliberately arranged face-framing tendrils. Elegant female presence with body proportions as specified in the scene and elegantly rendered scene-appropriate clothing. Retouched premium cosmetics-campaign finish with flattering soft key light, subtle warm skin against scene background, lovely tonal separation and exceptional face detail. Not a mundane candid photo, not gritty realism, not an older tired-looking housewife, not a teenager, not heavy plastic doll skin. The refinement must be in facial design, eyes, lips, hair and lighting together, not just blush or smoothing.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.",
  },
  {
    id: 'H',
    label: 'H · 美型电影 CG',
    summary: 'GANTZ:O 方向的美型三维数字角色，明确 CG 建模与材质感，不是真人照片。',
    prompt:
      'A fully computer-generated cinematic frame inspired by the beautiful adult female digital character design of GANTZ:O (2016), NOT a live-action photograph. Original adult East Asian female character, not an actor likeness. Clearly sculpted idealized 3D heroine: elegant narrow oval face, beautifully designed slightly enlarged almond eyes, precise sculpted eyelids, delicate small nose, shapely softly full lips, clean graceful facial planes, attractive mature feminine proportions. High-end offline-rendered digital human with smooth controlled subsurface scattering, art-directed skin specular highlights, individually groomed silky hair strands, physically rendered clothing fabric and cinematic global illumination. Retain a visible polished CG character aesthetic rather than collapsing into photographic realism: intentional model topology-like clean forms, exquisitely designed face and controlled material response, the sophisticated stylization of a Japanese feature-film CG heroine. Figure proportions as specified in the scene, relaxed subtle expression. Soft luminous face lighting and cool cinematic environment. This is an entirely rendered 3D environment and 3D character, no real-camera photograph, no ordinary human casting, no flat 2D anime, no cel outlines, no game HUD, retain the scene clothing rather than adding a Gantz suit.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'I',
    label: 'I · 美型强化 CG',
    summary: '进一步理想化五官的电影 CG，美型优先、柔和皮肤与精细发丝。',
    prompt:
      'Beauty-enhanced Japanese cinematic 3D heroine rendering inspired by the full-CG film GANTZ:O, with more idealized facial design. A strikingly beautiful adult East Asian heroine: refined softly tapered jaw, full youthful cheeks, slightly larger expressive almond eyes, delicate eyelids and long individual lashes, small straight nose, soft glossy lips. Smooth luminous skin with restrained subsurface scattering and soft beauty illumination. Highly detailed realistic hair strands and fabric, physically grounded 3D materials, polished film-CG finish. Prioritize elegant facial appeal over documentary realism; no coarse pores or age creases. Not a plastic doll, not a Western cartoon, not flat anime, not a photograph. Keep the specified clothing and setting; do not add combat outfits or sci-fi props.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
];

export function getStylePreset(id: string) {
  return STYLE_PRESETS.find(preset => preset.id === id);
}
