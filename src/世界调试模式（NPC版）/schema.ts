export const Schema = z.object({
  世界: z.object({
    当前时间: z.string(),
    当前地点: z.string(),
    公开常识版本: z.string(),
    当前规则摘要: z.string(),
    生效规则: z
      .record(
        z.string().describe('规则代号'),
        z.object({
          规则类型: z.string(),
          目标范围: z.string(),
          生效方式: z.string(),
          规则摘要: z.string(),
          当前状态: z.string(),
        }),
      )
      .transform(data => _(data).entries().takeRight(8).fromPairs().value()),
    公开常识: z
      .record(
        z.string().describe('常识代号'),
        z.object({
          常识内容: z.string(),
          适用范围: z.string(),
          表现载体: z.string(),
        }),
      )
      .transform(data => _(data).entries().takeRight(8).fromPairs().value()),
    规则影响维度: z
      .record(
        z.string().describe('影响维度'),
        z.object({
          状态: z.string(),
          说明: z.string(),
        }),
      )
      .transform(data => _(data).entries().takeRight(10).fromPairs().value()),
    规则稳定度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
    最近变更: z
      .record(
        z.string().describe('变更代号'),
        z.object({
          说明: z.string(),
          影响范围: z.string(),
          杨世发观测: z.string(),
        }),
      )
      .transform(data => _(data).entries().takeRight(6).fromPairs().value()),
  }),

  杨世发: z.object({
    年龄: z.coerce.number(),
    身份: z.string(),
    年级: z.string(),
    当前位置: z.string(),
    当前目标: z.string(),
    认知状态: z.string(),
    异常认知压力: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
    对世界异常的怀疑: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
    社会伪装程度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
    随身物品: z
      .record(
        z.string().describe('物品名'),
        z.object({
          描述: z.string(),
          数量: z.coerce.number(),
        }),
      )
      .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0)),
  }),

  调试者遮蔽: z.object({
    _存在事实: z.string(),
    _身份状态: z.string(),
    _交流许可: z.boolean(),
    _互知许可: z.boolean(),
    遮蔽强度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
    叙事备注: z.string(),
  }),
});
export type Schema = z.output<typeof Schema>;
