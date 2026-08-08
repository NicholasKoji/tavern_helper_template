export const Schema = z.object({
  当前场景: z
    .object({
      地点: z.string().prefault('待生成'),
      时间: z.string().prefault('待生成'),
      摘要: z.string().prefault('等待玩家完成世界配置'),
    })
    .prefault({}),

 世界配置: z
    .object({
      世界模板: z.string().prefault('现代都市'),
      世界观描述: z.string().prefault('普通现代都市，玩家刚捡到现实编辑器'),
      时代背景: z.string().prefault('现代都市'),
      文明与势力: z.string().prefault('普通现代社会，势力简单'),
      地理与气候: z.string().prefault('普通城市环境，四季分明'),
      历史与事件: z.string().prefault('无特殊历史事件'),
      核心冲突: z.string().prefault('暂无明确主线，先由日常荒诞展开'),
      玩法模式: z
        .object({
          认知: z.enum(['是', '否']).prefault('是'),
          使用: z.enum(['是', '否']).prefault('是'),
          受控: z.enum(['是', '否']).prefault('是'),
          编辑器篡改: z
            .enum(['A-完全随机', 'B-倾向色色', 'C-不涉及物理', 'D-完全禁止', 'E-玩家插件伪装'])
            .prefault('D-完全禁止'),
        })
        .prefault({}),
      基调: z
        .object({
          色情浓度: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 100))
            .prefault(40),
          搞笑程度: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 100))
            .prefault(70),
          轻松程度: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 100))
            .prefault(70),
        })
        .prefault({}),
      允许黑深残: z.boolean().prefault(false),
      主角补充设定: z.string().prefault('暂无补充设定'),
      剧情方向: z
        .object({
          开局场景: z.string().prefault('家中'),
          主线目标: z.string().prefault('先弄清楚现实编辑器的来历与能力'),
          节奏: z.enum(['日常', '冒险', '悬疑', '轻松']).prefault('轻松'),
          暧昧开局: z.boolean().prefault(false),
        })
        .prefault({}),
      常识规则: z.record(z.string().describe('规则名'), z.string().describe('规则内容')).prefault({}),
      行为习惯: z.record(z.string().describe('习惯名'), z.string().describe('习惯内容')).prefault({}),
      物理规则: z.record(z.string().describe('规则名'), z.string().describe('规则内容')).prefault({}),
      超自然规则: z.record(z.string().describe('规则名'), z.string().describe('规则内容')).prefault({}),
      创建时间: z.string().prefault(''),
    })
    .prefault({}),

 现实编辑器: z
    .object({
      状态: z.enum(['正常', '维护中', '待机']).prefault('待机'),
      版本: z.string().prefault('v0.1.0-alpha'),
      权限: z
        .object({
          修改世界规则: z.boolean().prefault(true),
          修改自身权限: z.boolean().prefault(false),
          卸载本设备: z.boolean().prefault(false),
        })
        .prefault({}),
      生效规则: z
        .record(
          z.string().describe('规则类别'),
          z.record(z.string().describe('规则名'), z.string().describe('规则内容')),
        )
        .prefault({}),
    })
    .prefault({}),

  主角: z
    .object({
      姓名: z.string().prefault(''),
      身份: z.string().prefault('普通居民'),
      补充设定: z.string().prefault(''),
      性格: z.string().prefault(''),
      目标: z.string().prefault(''),
      与编辑器关系: z.string().prefault('刚捡到'),
    })
    .prefault({}),

  NPC序列: z
    .record(
      z.string().describe('NPC名称'),
      z
        .object({
          基础信息: z
            .object({
              姓名: z.string().prefault(''),
              性别: z.string().prefault('女'),
              年龄: z.string().prefault(''),
              身份: z.string().prefault(''),
              与主角关系: z.string().prefault(''),
              外貌特征: z.string().prefault(''),
              性格: z.string().prefault(''),
            })
            .prefault({}),
          当前想法: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
