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

  重要NPC: z
    .record(
      z.string().describe('NPC代号'),
      z.object({
        基本信息: z.object({
          姓名或称呼: z.string(),
          身份: z.string(),
          所在地点: z.string(),
          关系定位: z.string(),
        }),
        互动记录: z.object({
          初次登场: z.string(),
          最近互动: z.string(),
          杨世发已知信息: z.string(),
        }),
        关系指标: z.object({
          好感度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
          信任度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
          警觉度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
        }),
        当前状态: z.string(),
        对杨世发态度: z.string(),
        叙事备注: z.string(),
      }),
    )
    .transform(data => _(data).entries().takeRight(12).fromPairs().value())
    .prefault({}),

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
