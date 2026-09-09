export type ProviderProtocol = 'openai-images' | 'chat-completions';

export type AspectRatioPreset = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | 'custom';

export type SizePreset = '1024x1024' | '1024x1536' | '1536x1024' | 'custom';

export type PlannerConnectionMode = 'follow-tavern' | 'custom-openai';

export type StoryImageSettings = {
  enabled: boolean;

  planner: {
    contextMessageCount: number;
    sceneCount: number;
    connectionMode: PlannerConnectionMode;
    baseUrl: string;
    apiKey: string;
    endpoint: string;
    modelsEndpoint: string;
    availableModels: string[];
    model: string;
    timeoutMs: number;
    customEndpointOverride: boolean;
  };

  provider: {
    protocol: ProviderProtocol;
    baseUrl: string;
    endpoint: string;
    modelsEndpoint: string;
    apiKey: string;
    model: string;
    availableModels: string[];
    customEndpointOverride: boolean;
    timeoutMs: number;
  };

  behavior: {
    autoPlanEnabled: boolean;
    autoGenerateImageEnabled: boolean;
    enableDoubleClick: boolean;
    enableQuickButton: boolean;
  };

  canvas: {
    aspectRatioPreset: AspectRatioPreset;
    customAspectRatio: string;
    sizePreset: SizePreset;
    customSize: string;
  };

  visual: {
    maxVisiblePeople: number;
    characterSpecialization: string;
    characterSpecializationEdits: Record<string, string>;
    compositionPreset: string;
    compositionCustom: string;
    stylePreset: string;
    styleCustom: string;
    lightingPreset: string;
    lightingCustom: string;
    qualityPreset: string;
    qualityCustom: string;
    globalRequirements: string;
    avoidRequirements: string;
  };
};

export type StaleReason = 'message-edited' | 'prompt-edited' | 'regenerated';

export type StoredImage = {
  imageId: string;
  path: string;
  mimeType: string;
  createdAt: number;
  finalPrompt: string;
  providerProtocol: ProviderProtocol;
  model: string;
  collapsed: boolean;
  staleReason?: StaleReason;
};

export type SwipeAnchor = {
  quote: string;
  occurrence: number; // 1-based index
  placement: 'after';
};

export type StoryImageSwipeStatus = 'planning' | 'planned' | 'generating' | 'ready' | 'error';

export type StoryImageErrorStage = 'planning' | 'generation' | 'download' | 'upload' | 'render';

export type StoryImageSwipeError = {
  stage: StoryImageErrorStage;
  message: string;
};

export type StoryImageSwipeState = {
  sceneId?: string;
  queued?: boolean;
  anchorWarning?: string;
  scenes?: StoryImageSwipeState[];
  status: StoryImageSwipeStatus;
  sourceFingerprint: string;
  operationVersion: number;

  anchor?: SwipeAnchor;

  sceneSummary?: string;
  scenePrompt?: string;
  characterIds?: string[];
  referenceFraming?: string;
  promptEditedByUser?: boolean;

  currentImage?: StoredImage;
  history: StoredImage[];

  error?: StoryImageSwipeError;
};

export type StoryImageMessageData = {
  version: 1;
  swipes: Record<string, StoryImageSwipeState>;
};

export type SlotAction =
  | 'generate'
  | 'cancel'
  | 'retry-plan'
  | 'retry-gen'
  | 'regenerate'
  | 'toggle-edit'
  | 'save-prompt'
  | 'cancel-edit'
  | 'anchor-failed'
  | 'anchor-resolved';

export type PlannerResult = {
  anchor: SwipeAnchor;
  scene_summary: string;
  scene_prompt: string;
  character_ids: string[];
  reference_framing: string;
};

export type GeneratedImagePayload = { kind: 'base64'; data: string; mimeType: string } | { kind: 'url'; url: string };

export type PlanPostAction = 'follow-setting' | 'force-image' | 'prompt-only';

export type PopoverAction =
  | 'plan'
  | 'plan-only'
  | 'plan-and-generate'
  | 'manual-prompt'
  | 'generate'
  | 'replan'
  | 'replan-only'
  | 'replan-and-generate'
  | 'edit-prompt'
  | 'regenerate';

export type MvuRule = {
  path: string;
  alias?: string;
  enabled: boolean;
};

export type CharacterMvuSettings = {
  enabled: boolean;
  rules: MvuRule[];
};

export type MvuTreeNode = {
  path: string;
  key: string;
  valueText?: string;
  isLeaf: boolean;
  children?: MvuTreeNode[];
};
