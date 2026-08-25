import {
  buildChatLoreSpecs,
  CHAT_LORE_NAMES,
  type ChatLoreKind,
  type ChatLoreSpec,
  type OpeningFormSnapshot,
} from './opening';

const EXTRA_NAMESPACE = 'human_revision';
const CHAT_LORE_ORDER = 14730;

type ChatLoreEntry = Omit<WorldbookEntry, 'uid' | 'position'> & {
  uid?: number;
  position: Omit<WorldbookEntry['position'], 'role' | 'depth'> & {
    type: 'after_character_definition';
  };
};

function getManagedKind(entry: Partial<WorldbookEntry>): ChatLoreKind | null {
  const metadata = entry.extra?.[EXTRA_NAMESPACE];
  if (metadata?.managed === 'npc-lore') return null;
  if (metadata?.kind === 'world' || metadata?.kind === 'editor') return metadata.kind;
  if (entry.name === CHAT_LORE_NAMES.world) return 'world';
  if (entry.name === CHAT_LORE_NAMES.editor) return 'editor';
  return null;
}

function makeEntry(spec: ChatLoreSpec, previous?: WorldbookEntry): ChatLoreEntry {
  return {
    ...(previous ?? {
      name: spec.name,
      enabled: true,
      strategy: {
        type: 'constant',
        keys: [],
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: { type: 'after_character_definition', order: CHAT_LORE_ORDER },
      content: spec.content,
      probability: 100,
      recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
      effect: { sticky: null, cooldown: null, delay: null },
    }),
    name: spec.name,
    enabled: true,
    strategy: {
      ...(previous?.strategy ?? {}),
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      order: CHAT_LORE_ORDER,
    },
    content: spec.content,
    probability: 100,
    recursion: {
      ...(previous?.recursion ?? {}),
      prevent_incoming: true,
      prevent_outgoing: true,
      delay_until: null,
    },
    effect: { ...(previous?.effect ?? {}), sticky: null, cooldown: null, delay: null },
    extra: {
      ...(previous?.extra ?? {}),
      [EXTRA_NAMESPACE]: { managed: 'chat-lore', schema: 1, kind: spec.kind },
    },
  };
}

export function upsertChatLoreEntries(
  entries: WorldbookEntry[],
  specs: ChatLoreSpec[],
): Array<WorldbookEntry | ChatLoreEntry> {
  const previousByKind = new Map<ChatLoreKind, WorldbookEntry>();
  for (const entry of entries) {
    const kind = getManagedKind(entry);
    if (kind && !previousByKind.has(kind)) previousByKind.set(kind, entry);
  }
  const preserved = entries.filter(entry => getManagedKind(entry) === null);
  return [...preserved, ...specs.map(spec => makeEntry(spec, previousByKind.get(spec.kind)))];
}

export type ChatLoreMutation = {
  worldbookName: string;
  originalWorldbookName: string | null;
  originalEntries: WorldbookEntry[];
  beforeEntries: WorldbookEntry[];
  worldbookCreated: boolean;
  expectedSpecs?: ChatLoreSpec[];
  replaceResult?: boolean;
};

const CHAT_LORE_DELETE_CHECKS = 6;
const CHAT_LORE_VERIFY_CHECKS = 8;
// JS-Slash-Runner's createOrReplaceWorldbook delegates to SillyTavern's
// debounced saveWorldInfo (relaxed debounce = 1000ms). Wait for that write to
// settle before a later rollback can delete the newly created file.
const CHAT_LORE_WRITE_SETTLE_MS = 1250;

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function isWorldbookPresent(name: string): boolean {
  return getWorldbookNames().includes(name);
}

async function settlePendingWorldbookWrite(): Promise<void> {
  await delay(CHAT_LORE_WRITE_SETTLE_MS);
}

function entriesMatch(actual: WorldbookEntry[], expected: WorldbookEntry[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => JSON.stringify(entry) === JSON.stringify(expected[index]))
  );
}

async function verifyRestoredWorldbook(name: string, expected: WorldbookEntry[]): Promise<void> {
  const actual = await getWorldbook(name);
  if (!entriesMatch(actual, expected)) {
    throw new Error(`Chat Lore 回滚后原条目未恢复：${name}，当前 ${actual.length} 条，预期 ${expected.length} 条`);
  }
}

function logChatLorePhase(phase: string, details: Record<string, unknown>): void {
  console.info(`[人间修订中·Chat Lore] ${phase}`, details);
}

async function deleteWorldbookAndVerify(name: string): Promise<void> {
  const deleted = await deleteWorldbook(name);
  if (!deleted && isWorldbookPresent(name)) {
    throw new Error(`deleteWorldbook 返回 false，世界书仍在运行时列表中：${name}`);
  }
  for (let attempt = 0; attempt < CHAT_LORE_DELETE_CHECKS; attempt += 1) {
    if (!isWorldbookPresent(name)) return;
    await delay(25 * (attempt + 1));
  }
  throw new Error(`deleteWorldbook 已返回 ${String(deleted)}，但删除后仍能找到世界书：${name}`);
}

async function unbindChatWorldbookAndVerify(): Promise<void> {
  await setChatLorebook(null);
  const remainingBinding = getChatWorldbookName('current');
  if (remainingBinding !== null) {
    throw new Error(`setChatLorebook(null) 返回后聊天仍绑定世界书：${remainingBinding}`);
  }
}

async function waitForChatLoreBinding(worldbookName: string): Promise<void> {
  for (let attempt = 0; attempt < CHAT_LORE_VERIFY_CHECKS; attempt += 1) {
    if (isWorldbookPresent(worldbookName) && getChatWorldbookName('current') === worldbookName) return;
    await delay(25 * (attempt + 1));
  }
  throw new Error(`Chat Lore 写入后未确认当前聊天绑定世界书：${worldbookName}`);
}

export async function verifyChatLoreMutation(
  mutation: ChatLoreMutation,
  specs: ChatLoreSpec[] = mutation.expectedSpecs ?? [],
): Promise<{ binding: string | null; entries: WorldbookEntry[]; managedEntries: WorldbookEntry[] }> {
  await waitForChatLoreBinding(mutation.worldbookName);
  const entries = await getWorldbook(mutation.worldbookName);
  const managedEntries = entries.filter(entry => getManagedKind(entry) !== null);
  const contentMatches = specs.every(spec =>
    managedEntries.some(
      entry => getManagedKind(entry) === spec.kind && entry.name === spec.name && entry.content === spec.content,
    ),
  );
  if (managedEntries.length !== specs.length || !contentMatches) {
    throw new Error(
      `Chat Lore 写后校验失败：受管条目 ${managedEntries.length}/${specs.length}，内容匹配=${String(contentMatches)}`,
    );
  }
  const binding = getChatWorldbookName('current');
  logChatLorePhase('write-verified', {
    worldbookName: mutation.worldbookName,
    binding,
    worldbookPresent: isWorldbookPresent(mutation.worldbookName),
    managedEntryCount: managedEntries.length,
    managedEntryNames: managedEntries.map(entry => entry.name),
    contentMatches,
  });
  return { binding, entries, managedEntries };
}

export async function commitCurrentChatLore(snapshot: OpeningFormSnapshot): Promise<ChatLoreMutation> {
  const originalWorldbookName = getChatWorldbookName('current');
  const originalEntries = originalWorldbookName ? await getWorldbook(originalWorldbookName) : [];
  const knownWorldbooks = new Set(getWorldbookNames());
  let mutation: ChatLoreMutation | undefined;
  try {
    const worldbookName = await getOrCreateChatWorldbook('current');
    logChatLorePhase('get-or-create', {
      worldbookName,
      worldbookCreated: !knownWorldbooks.has(worldbookName),
      knownWorldbookCount: knownWorldbooks.size,
      currentBinding: getChatWorldbookName('current'),
      worldbookPresent: isWorldbookPresent(worldbookName),
    });
    const beforeEntries = await getWorldbook(worldbookName);
    const expectedSpecs = buildChatLoreSpecs(snapshot);
    mutation = {
      worldbookName,
      originalWorldbookName,
      originalEntries,
      beforeEntries,
      worldbookCreated: !knownWorldbooks.has(worldbookName),
      expectedSpecs,
    };
    const nextEntries = upsertChatLoreEntries(beforeEntries, expectedSpecs);
    mutation.replaceResult = await createOrReplaceWorldbook(worldbookName, nextEntries, { render: 'immediate' });
    await settlePendingWorldbookWrite();
    logChatLorePhase('write-returned', {
      worldbookName,
      createOrReplaceWorldbookResult: mutation.replaceResult,
      expectedEntryCount: expectedSpecs.length,
    });
    await verifyChatLoreMutation(mutation, expectedSpecs);
    return mutation;
  } catch (error) {
    try {
      if (mutation) {
        await rollbackChatLoreMutation(mutation);
      } else {
        await settlePendingWorldbookWrite();
        const leakedWorldbooks = getWorldbookNames().filter(name => !knownWorldbooks.has(name));
        for (const leakedWorldbook of leakedWorldbooks) {
          if (getChatWorldbookName('current') === leakedWorldbook) await unbindChatWorldbookAndVerify();
          await deleteWorldbookAndVerify(leakedWorldbook);
        }
      }
    } catch (rollbackError) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      const detail = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      originalError.message = `${originalError.message}；Chat Lore 回滚失败：${detail}`;
      throw originalError;
    }
    throw error;
  }
}

export type CurrentChatLoreMutationContext = {
  worldbookName: string;
  originalWorldbookName: string | null;
  originalEntries: WorldbookEntry[];
  beforeEntries: WorldbookEntry[];
  worldbookCreated: boolean;
};

/**
 * 为状态栏等局部功能提供与世界配置相同的安全事务：确认阶段重新读取世界书，
 * updater 只返回需要保留的完整列表；写入或回读校验失败时恢复原绑定和原条目。
 */
export async function commitCurrentChatLoreEntries(
  updater: (context: CurrentChatLoreMutationContext) => Partial<WorldbookEntry>[] | Promise<Partial<WorldbookEntry>[]>,
  verify?: (worldbookName: string, entries: WorldbookEntry[]) => void | Promise<void>,
): Promise<ChatLoreMutation> {
  const originalWorldbookName = getChatWorldbookName('current');
  const originalEntries = originalWorldbookName ? await getWorldbook(originalWorldbookName) : [];
  const knownWorldbooks = new Set(getWorldbookNames());
  let mutation: ChatLoreMutation | undefined;
  let writeStarted = false;

  try {
    const worldbookName = await getOrCreateChatWorldbook('current');
    const beforeEntries = await getWorldbook(worldbookName);
    mutation = {
      worldbookName,
      originalWorldbookName,
      originalEntries,
      beforeEntries,
      worldbookCreated: !knownWorldbooks.has(worldbookName),
    };
    const nextEntries = await updater({
      worldbookName,
      originalWorldbookName,
      originalEntries,
      beforeEntries,
      worldbookCreated: mutation.worldbookCreated,
    });
    writeStarted = true;
    mutation.replaceResult = await createOrReplaceWorldbook(worldbookName, nextEntries, { render: 'immediate' });
    await settlePendingWorldbookWrite();
    const afterEntries = await getWorldbook(worldbookName);
    await verify?.(worldbookName, afterEntries);
    return mutation;
  } catch (error) {
    try {
      // updater 在已有世界书上发现冲突时尚未写入，保留其他进程刚刚完成的改动；
      // 新建世界书或已开始写入时才执行完整回滚。
      if (mutation && (writeStarted || mutation.worldbookCreated)) {
        await rollbackChatLoreMutation(mutation);
      } else if (!mutation) {
        await settlePendingWorldbookWrite();
        const leakedWorldbooks = getWorldbookNames().filter(name => !knownWorldbooks.has(name));
        for (const leakedWorldbook of leakedWorldbooks) {
          if (getChatWorldbookName('current') === leakedWorldbook) await unbindChatWorldbookAndVerify();
          await deleteWorldbookAndVerify(leakedWorldbook);
        }
      }
    } catch (rollbackError) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      const detail = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      originalError.message = `${originalError.message}；Chat Lore 回滚失败：${detail}`;
      throw originalError;
    }
    throw error;
  }
}

export async function rollbackChatLoreMutation(mutation: ChatLoreMutation): Promise<void> {
  await settlePendingWorldbookWrite();
  if (mutation.originalWorldbookName) {
    if (getChatWorldbookName('current') !== mutation.originalWorldbookName) {
      await rebindChatWorldbook('current', mutation.originalWorldbookName);
    }
    if (getChatWorldbookName('current') !== mutation.originalWorldbookName) {
      throw new Error(`rebindChatWorldbook 返回后聊天仍未恢复原绑定：${mutation.originalWorldbookName}`);
    }
    await createOrReplaceWorldbook(mutation.originalWorldbookName, mutation.originalEntries, { render: 'immediate' });
    await settlePendingWorldbookWrite();
    await verifyRestoredWorldbook(mutation.originalWorldbookName, mutation.originalEntries);
    if (mutation.worldbookCreated && mutation.worldbookName !== mutation.originalWorldbookName) {
      await deleteWorldbookAndVerify(mutation.worldbookName);
    }
    return;
  }

  if (getChatWorldbookName('current') === mutation.worldbookName) {
    // 当前运行时以 setChatLorebook(null) 表示解绑；rebindChatWorldbook 只接受世界书名称。
    await unbindChatWorldbookAndVerify();
  }
  if (mutation.worldbookCreated) {
    await deleteWorldbookAndVerify(mutation.worldbookName);
  } else {
    await createOrReplaceWorldbook(mutation.worldbookName, mutation.beforeEntries, { render: 'immediate' });
    await settlePendingWorldbookWrite();
    await verifyRestoredWorldbook(mutation.worldbookName, mutation.beforeEntries);
  }
}
