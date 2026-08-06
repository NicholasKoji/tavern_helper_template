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
      允许抽风: z.boolean().prefault(true),
      抽风频率: z.enum(['低', '中', '高', '随心所欲']).prefault('中'),
      主角补充设定: z.string().prefault('暂无补充设定'),
      常识规则: z.record(z.string().describe('规则名'), z.string().describe('规则内容')).prefault({}),
      行为习惯: z.record(z.string().describe('习惯名'), z.string().describe('习惯内容')).prefault({}),
      物理规则: z.record(z.string().describe('规则名'), z.string().describe('规则内容')).prefault({}),
      创建时间: z.string().prefault(''),
    })
    .prefault({}),

  现实编辑器: z
    .object({
      状态: z.enum(['正常', '抽风中', '维护中', '待机']).prefault('待机'),
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
      抽风记录: z
        .record(
          z.string().describe('记录名'),
          z
            .object({
              时间: z.string().prefault(''),
              改动: z.string().prefault(''),
              结果: z.string().prefault(''),
              是否被主角发现: z.boolean().prefault(false),
            })
            .prefault({}),
        )
        .prefault({}),
      下次抽风提示: z.string().prefault('暂无'),
    })
    .prefault({}),

  主角: z
    .object({
      姓名: z.string().prefault(''),
      身份: z.string().prefault('普通居民'),
      补充设定: z.string().prefault(''),
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
            })
            .prefault({}),
          当前想法: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
