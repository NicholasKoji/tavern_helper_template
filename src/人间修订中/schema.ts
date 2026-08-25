export const Schema = z.object({
  当前场景: z
    .object({
      地点: z
        .object({
          一级区域: z.string().prefault('待生成'),
          二级区域: z.string().prefault('待生成'),
          三级地点: z.string().prefault('待生成'),
        })
        .prefault({}),
      日期: z
        .object({
          年: z.coerce
            .number()
            .transform(value => _.clamp(value, 1, 9999))
            .nullable()
            .prefault(null),
          月: z.coerce
            .number()
            .transform(value => _.clamp(value, 1, 12))
            .nullable()
            .prefault(null),
          日: z.coerce
            .number()
            .transform(value => _.clamp(value, 1, 31))
            .nullable()
            .prefault(null),
        })
        .prefault({}),
      时间: z
        .object({
          时: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 23))
            .nullable()
            .prefault(null),
          分: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 59))
            .nullable()
            .prefault(null),
        })
        .prefault({}),
      摘要: z.string().prefault('等待玩家完成开场签发'),
    })
    .prefault({}),

  主角: z
    .object({
      启用: z.boolean().prefault(true),
      基础信息: z
        .object({
          姓名: z.string().prefault(''),
          性别: z.string().prefault(''),
          年龄: z.coerce
            .number()
            .transform(value => _.clamp(value, -1, 200))
            .prefault(-1),
          身份: z.string().prefault(''),
          目标: z.string().prefault(''),
          与编辑器关系: z.string().prefault(''),
        })
        .prefault({}),
      外貌: z
        .object({
          身高: z.string().prefault(''),
          体型: z.string().prefault(''),
          面容气质: z.string().prefault(''),
          身体特征: z.string().prefault(''),
        })
        .prefault({}),
      性格: z
        .object({
          底色: z.string().prefault(''),
          主色调: z.string().prefault(''),
        })
        .prefault({}),
      补充设定: z.string().prefault(''),
      当前状态: z.string().prefault(''),
      穿着: z
        .object({
          上装: z.string().prefault(''),
          下装: z.string().prefault(''),
          内衣: z.string().prefault(''),
          袜子: z.string().prefault(''),
          鞋子: z.string().prefault(''),
          配饰: z.string().prefault('无'),
        })
        .prefault({}),
      私密状态: z
        .record(
          z.string().describe('部位名称'),
          z
            .object({
              外观描述: z.string().prefault(''),
              当前状态: z.string().prefault(''),
            })
            .prefault({}),
        )
        .prefault({}),
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
              性别: z.string().prefault(''),
              年龄: z.coerce
                .number()
                .transform(value => (value === -1 ? -1 : _.clamp(value, 0, 200)))
                .prefault(-1),
              身份: z.string().prefault(''),
              关系定位: z.string().prefault(''),
              好感度: z.coerce
                .number()
                .transform(value => _.clamp(value, 0, 100))
                .prefault(0),
            })
            .prefault({}),
          外貌: z
            .object({
              身高: z.string().prefault(''),
              罩杯: z.string().prefault('不适用'),
              体型: z.string().prefault(''),
              面容气质: z.string().prefault(''),
              身体特征: z.string().prefault(''),
            })
            .prefault({}),
          性格: z
            .object({
              底色: z.string().prefault(''),
              主色调: z.string().prefault(''),
            })
            .prefault({}),
          当前状态: z.string().prefault(''),
          穿着: z
            .object({
              上装: z.string().prefault(''),
              下装: z.string().prefault(''),
              内衣: z.string().prefault(''),
              袜子: z.string().prefault(''),
              鞋子: z.string().prefault(''),
              配饰: z.string().prefault('无'),
            })
            .prefault({}),
          当前想法: z.string().prefault(''),
          私密状态: z
            .record(
              z.string().describe('部位名称'),
              z
                .object({
                  外观描述: z.string().prefault(''),
                  当前状态: z.string().prefault(''),
                })
                .prefault({}),
            )
            .prefault({}),
        })
        .prefault({}),
    )
    .prefault({}),

  现实编辑器: z
    .object({
      是否显现: z.boolean().prefault(false),
      状态: z.enum(['正常', '维护中', '待机']).prefault('待机'),
      最近反馈: z.string().prefault(''),
    })
    .prefault({}),

  生效规则: z
    .object({
      世界规则: z.record(z.string().describe('规则名'), z.string().describe('规则内容')).prefault({}),
      区域规则: z
        .record(z.string().describe('区域名'), z.record(z.string().describe('规则名'), z.string().describe('规则内容')))
        .prefault({}),
      个人规则: z
        .record(z.string().describe('对象名'), z.record(z.string().describe('规则名'), z.string().describe('规则内容')))
        .prefault({}),
    })
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
