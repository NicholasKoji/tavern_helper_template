import type { ModelAdaptation } from './types';
import { B2_STYLE_REFERENCE } from './style-reference';

export type StyleReference = {
  label: string;
  imageUrl: string;
};

export type StylePreset = {
  id: string;
  label: string;
  summary: string;
  plannerHint: string;
  prompt: string;
  styleReference?: StyleReference;
};

const GPT_IMAGE_SHARED_CONTRACT =
  'Content priority: the current scene and character references define identity, explicit age, ethnicity, gender, hair, clothing, action, setting and time. The selected character specialization defines female facial refinement, body proportions, grooming and bearing. This style preset controls only the visual medium, linework, materials, color treatment and rendering finish. Keep different characters visually distinct, render only described people and objects, and produce one coherent single-frame image without captions, interface elements or watermarks.';

function gptImagePrompt(prompt: string): string {
  return `${prompt}\n${GPT_IMAGE_SHARED_CONTRACT}`;
}

export const NANO_BANANA_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'anime-film-nano-banana',
    label: '日漫 / 新海诚方向',
    summary: '细线条、清透色彩与柔和赛璐璐明暗的二维日漫人物。',
    plannerHint: '二维日式电影动画；优先选择能表现人物神态、环境光和清晰空间层次的镜头。',
    prompt:
      'A refined Japanese 2D anime film still in the visual style of Makoto Shinkai films such as The Garden of Words, Your Name and Weathering with You. Focus on elegant adult female character drawing: thin precise colored contours, beautiful delicately drawn eyes, simplified refined nose and lips, coherent cel-shaded facial planes, finely grouped hair strands with luminous rim highlights. Restrained soft light bloom, clear airy colors, carefully painted light and gentle environmental reflections. Believable character proportions matching the scene description. Character and background share a harmonious cinematic palette. Keep it visibly hand-drawn 2D animation, not live action, 3D CG or painterly semi-realism.  Do not turn the shot into a landscape or shrink the woman.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'action-webtoon-nano-banana',
    label: '热血韩漫',
    summary: '锐利眼型、利落轮廓、强弱分明阴影的热血韩漫画法，不改变剧情题材。',
    plannerHint: '锐利热血韩漫；优先选择轮廓清楚、动作关系明确、明暗层次有张力的镜头。',
    prompt:
      'Premium Korean action-webtoon illustration, drawing on the sharp character design and polished rendering of Solo Leveling and Omniscient Readers Viewpoint. A striking adult female lead with sharp expressive almond eyes, precise lashes, refined angular facial contours, confident quiet presence and a clean expressive silhouette. Crisp tapered linework, strong but flattering cel-shadow shapes, controlled gradients, polished hair highlights, energetic clean silhouette and clearly articulated limbs. Attractive adult face, not exaggerated masculine anatomy. Apply this drawing language to the supplied scene. Do not add combat, powers, weapons or armor unless the scene calls for them.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'refined-female-webtoon-nano-banana',
    label: '精致女性韩漫（附参考图）',
    summary: '精细眼睑与唇形、立体上色的女性韩漫画法，参考图仅控制画法。',
    plannerHint: '精致女性韩漫；优先选择能清楚表现面部、人物关系和柔和立体上色的镜头。',
    prompt:
      'Refined Korean webtoon illustration in the visual drawing style of Domesticate The Housekeeper by SERIOUS. The attached banner is a STYLE reference only: study ONLY the adult woman on the far right, wearing a red high-neck top with long white hair. Transfer the eye and eyelid drawing, refined lips, facial contours, clean linework and dimensional color-shading language to the scene characters. Preserve the scene character identity, age, hair, body type, clothing, expression and action. Do not copy reference hair color, tan skin tone, red clothes, identity, banner layout or other characters. Beautiful polished 2D character illustration, not photography or CG.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
    styleReference: {
      label: '下一张是精致女性韩漫的画法参考，不是角色身份参考。',
      imageUrl: B2_STYLE_REFERENCE,
    },
  },
  {
    id: 'douyin-beauty-nano-banana',
    label: '抖音美颜网红',
    summary: '理想化真人网红美颜，协调五官、明亮眼神和精心妆发，非生活纪实。',
    plannerHint: '短视频美颜人像；优先选择主体清晰、面部受光友好、妆发与姿态可读的镜头。',
    prompt:
      'Douyin glamorous beauty-influencer aesthetic, deliberately idealized and strongly beauty-filtered live-action appearance, NOT documentary realism. An exceptionally beautiful mature East Asian influencer: luminous large almond eyes with lifted outer corners, precise eyeliner and fine curled lashes, beautifully arched brows, a refined small nose, soft sculpted oval face and delicate jawline, full softly glossy rose lips. Bright clear eyes and smooth luminous skin with flattering beauty retouching. Voluminous styled hair framing her face, polished peach-rose makeup that looks effortless but professionally designed. Preserve the explicit age and body design specified in the scene. Flattering beauty-camera rendering, luminous complexion, attractive facial proportions and gentle catchlights. No gritty pores, tired under-eye shadows, drab lighting, harsh nasolabial shadows or unstyled everyday appearance. Prioritize a striking beautiful face, not merely smoother skin on an average face.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'luxury-beauty-nano-banana',
    label: '精致轻奢美人',
    summary: '精雕五官与细腻妆发的轻奢美人，化妆品广告般精修完成度。',
    plannerHint: '轻奢美妆大片；优先选择造型完整、布光精致、人物与环境色调分离清楚的镜头。',
    prompt:
      "Luxury beauty-editorial portrait aesthetic with a highly refined idealized East Asian leading-lady face, more meticulously art-directed than a casual influencer selfie. Exceptionally harmonious facial proportions: elegant elongated almond eyes, delicately shaped eyelids and lashes, refined straight nose, beautifully defined cupid's bow and satin rose lips, sculpted but soft cheekbones and graceful jaw. Sophisticated understated glamour makeup with precise taupe eye contour, delicate highlight and immaculate luminous satin skin; coiffed glossy dark waves, a few deliberately arranged face-framing tendrils. Elegant female presence with body proportions as specified in the scene and elegantly rendered scene-appropriate clothing. Retouched premium cosmetics-campaign finish with flattering soft key light, subtle warm skin against scene background, lovely tonal separation and exceptional face detail. Not a mundane candid photo, not gritty realism, not an older tired-looking housewife, not a teenager, not heavy plastic doll skin. The refinement must be in facial design, eyes, lips, hair and lighting together, not just blush or smoothing.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.",
  },
  {
    id: 'cinematic-cg-nano-banana',
    label: '美型电影 CG',
    summary: 'GANTZ:O 方向的美型三维数字角色，明确 CG 建模与材质感，不是真人照片。',
    plannerHint: '风格化电影全 CG；优先选择能表现三维轮廓、材质、空间光照和电影构图的镜头。',
    prompt:
      'A fully computer-generated cinematic frame inspired by the beautiful adult female digital character design of GANTZ:O (2016), NOT a live-action photograph. Original adult East Asian female character, not an actor likeness. Clearly sculpted idealized 3D heroine: elegant narrow oval face, beautifully designed slightly enlarged almond eyes, precise sculpted eyelids, delicate small nose, shapely softly full lips, clean graceful facial planes, attractive mature feminine proportions. High-end offline-rendered digital human with smooth controlled subsurface scattering, art-directed skin specular highlights, individually groomed silky hair strands, physically rendered clothing fabric and cinematic global illumination. Retain a visible polished CG character aesthetic rather than collapsing into photographic realism: intentional model topology-like clean forms, exquisitely designed face and controlled material response, the sophisticated stylization of a Japanese feature-film CG heroine. Figure proportions as specified in the scene, relaxed subtle expression. Soft luminous face lighting and cool cinematic environment. This is an entirely rendered 3D environment and 3D character, no real-camera photograph, no ordinary human casting, no flat 2D anime, no cel outlines, no game HUD, retain the scene clothing rather than adding a Gantz suit.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
  {
    id: 'beauty-enhanced-cg-nano-banana',
    label: '美型强化 CG',
    summary: '进一步理想化五官的电影 CG，美型优先、柔和皮肤与精细发丝。',
    plannerHint: '近真人美型数字人；优先选择面部细节、精细发丝、柔和皮肤材质和时尚构图清楚的镜头。',
    prompt:
      'Beauty-enhanced Japanese cinematic 3D heroine rendering inspired by the full-CG film GANTZ:O, with more idealized facial design. A strikingly beautiful adult East Asian heroine: refined softly tapered jaw, full youthful cheeks, slightly larger expressive almond eyes, delicate eyelids and long individual lashes, small straight nose, soft glossy lips. Smooth luminous skin with restrained subsurface scattering and soft beauty illumination. Highly detailed realistic hair strands and fabric, physically grounded 3D materials, polished film-CG finish. Prioritize elegant facial appeal over documentary realism; no coarse pores or age creases. Not a plastic doll, not a Western cartoon, not flat anime, not a photograph. Keep the specified clothing and setting; do not add combat outfits or sci-fi props.\nStyle controls drawing and rendering only. The scene controls identity, age, ethnicity, gender, hair, body type, clothing, action, setting and time. The scene may already apply a female character specialization; follow its body proportions and beauty design rather than reverting them to stylistic defaults. Apply feminine beauty design to female subjects only; preserve other subjects as described.',
  },
];

export const GPT_IMAGE_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic-anime-gpt-image',
    label: '清透动画电影',
    summary: '手绘二维动画人物、通透环境光和统一的电影色彩。',
    plannerHint: '清透二维动画电影；优先选择能表现人物神态、环境光和空间层次的镜头。',
    prompt: gptImagePrompt(
      'Create a polished Japanese cinematic 2D animation still. Use thin, precise colored linework; elegant hand-drawn facial construction; expressive eyes; simplified yet refined nose and lips; coherent cel-shaded planes; and carefully grouped hair strands. Paint the setting with clear airy color, gentle reflected light, restrained bloom and luminous atmospheric depth. Characters and environment should share one cinematic palette and feel drawn in the same production. Preserve an unmistakably hand-drawn animation finish with clean silhouettes and readable character scale.',
    ),
  },
  {
    id: 'action-illustration-gpt-image',
    label: '锐线动作漫绘',
    summary: '锐利线条、清晰动作轮廓和富有张力的块面明暗。',
    plannerHint: '锐线动作漫绘；优先选择轮廓清楚、动作关系明确、明暗层次有张力的镜头。',
    prompt: gptImagePrompt(
      'Render the scene as a premium Korean action-webtoon panel without changing the story genre. Use crisp tapered ink lines, sharp expressive eye drawing, confident angular silhouettes, clearly articulated anatomy and strong cel-shadow shapes softened by controlled gradients. Give hair and fabric polished directional highlights, preserve clean separation between figures, and use cinematic contrast that supports the existing action or emotion. The result should feel like a finished vertical-webtoon key panel: energetic, precise and highly readable rather than painterly or photographic.',
    ),
  },
  {
    id: 'refined-character-webtoon-gpt-image',
    label: '精致人物条漫',
    summary: '细腻五官、干净线稿和柔和立体上色的精致人物漫绘。',
    plannerHint: '精致人物条漫；优先选择能清楚表现面部、人物关系和柔和立体上色的镜头。',
    prompt: gptImagePrompt(
      'Create a refined Korean character-webtoon illustration with delicate eyelid construction, precise lashes, shaped lips, graceful facial contours, clean fine linework and dimensional color shading. Keep every scene character derived from the scene and character references. Deliver a polished two-dimensional webtoon image with elegant faces, controlled highlights and smooth tonal transitions.',
    ),
  },
  {
    id: 'bright-fashion-photo-gpt-image',
    label: '明亮时尚写真',
    summary: '明亮清透、妆发精致且带柔和美颜质感的时尚写真。',
    plannerHint: '明亮时尚写真；优先选择主体清晰、面部受光友好、妆发与姿态可读的镜头。',
    prompt: gptImagePrompt(
      'Render the scene as polished short-video beauty photography with an intentionally flattering beauty-camera finish. Use bright clear eyes with delicate catchlights, carefully groomed hair, precise camera-ready makeup, luminous smooth skin that retains gentle natural structure, and soft facial modeling from flattering frontal or three-quarter light. Keep the original scene rather than turning it into a selfie. The image should feel glamorous, vivid and professionally retouched, with clean color, appealing facial presentation and believable photographic depth.',
    ),
  },
  {
    id: 'luxury-beauty-editorial-gpt-image',
    label: '轻奢美妆大片',
    summary: '高级美妆广告布光、缎面肤质与克制奢华的色彩完成度。',
    plannerHint: '轻奢美妆大片；优先选择造型完整、布光精致、人物与环境色调分离清楚的镜头。',
    prompt: gptImagePrompt(
      'Render the scene as a high-end beauty and fashion editorial with premium cosmetics-campaign finish. Use meticulous art direction, refined makeup and grooming, luminous satin skin, graceful facial modeling, soft sculpted key light, controlled highlights and elegant tonal separation from the background. Clothing and setting remain scene-appropriate but receive polished fabric detail and restrained luxury color grading. The result should feel sophisticated and aspirational, with exceptional face, hair and material detail carried consistently through the whole frame.',
    ),
  },
  {
    id: 'stylized-cinematic-cg-gpt-image',
    label: '风格化电影 CG',
    summary: '明确的三维雕刻感、电影级材质与统一的全 CG 空间。',
    plannerHint: '风格化电影全 CG；优先选择能表现三维轮廓、材质、空间光照和电影构图的镜头。',
    prompt: gptImagePrompt(
      'Create a fully computer-generated cinematic feature-film frame with visibly sculpted, idealized 3D characters. Use clean designed facial planes, controlled subsurface scattering, art-directed skin highlights, individually groomed hair, physically based fabric and environment materials, cinematic global illumination and polished offline-render quality. Preserve a clearly stylized digital-character finish rather than live-action casting: elegant modeled forms, intentional surface response and expressive but controlled animation-film faces. Render the complete setting and every subject as one coherent three-dimensional world.',
    ),
  },
  {
    id: 'high-fidelity-digital-human-gpt-image',
    label: '高精数字人 CG',
    summary: '接近真人但保持理想化设计感的高精数字人时尚画面。',
    plannerHint: '高精数字人 CG；优先选择面部细节、精细发丝、柔和皮肤材质和时尚构图清楚的镜头。',
    prompt: gptImagePrompt(
      'Render the scene as near-photoreal idealized digital-human CG with a beauty-first high-fashion finish. Use refined digital facial sculpture, luminous softly modeled skin, restrained subsurface scattering, delicate specular response, individually resolved lashes and hair strands, and physically grounded fabric detail. Favor graceful, aspirational character presentation and soft beauty illumination while retaining enough designed perfection to read as premium digital art rather than ordinary photography. Keep the environment cinematic, materially coherent and subtly more realistic than the stylized feature-film CG preset.',
    ),
  },
];

export const STYLE_PRESETS_BY_MODEL: Record<ModelAdaptation, StylePreset[]> = {
  'nano-banana': NANO_BANANA_STYLE_PRESETS,
  'gpt-image': GPT_IMAGE_STYLE_PRESETS,
};

export const DEFAULT_STYLE_PRESET_IDS: Record<ModelAdaptation, string> = {
  'nano-banana': 'douyin-beauty-nano-banana',
  'gpt-image': 'bright-fashion-photo-gpt-image',
};

export function getStylePresets(adaptation: ModelAdaptation): StylePreset[] {
  return STYLE_PRESETS_BY_MODEL[adaptation];
}

export function getStylePreset(adaptation: ModelAdaptation, id: string): StylePreset | undefined {
  return getStylePresets(adaptation).find(preset => preset.id === id);
}
