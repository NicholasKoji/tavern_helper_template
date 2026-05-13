export const Schema = z.object({
  世界: z.object({
    当前时间: z.string(),
    当前地点: z.string(),
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
          性别: z.string().prefault('女'),
          年龄: z.coerce.number().transform(value => _.clamp(value, 0, 120)),
          身份: z.string(),
          所在地点: z.string(),
          关系定位: z.string(),
        }),
        人物档案: z
          .object({
            关系: z.string().prefault('未记录'),
            性格: z.string().prefault('未记录'),
            背景: z.string().prefault('未记录'),
          })
          .prefault({}),
        外观: z
          .object({
            容貌: z.string(),
            身材: z.string(),
            身体特征: z
              .object({
                身高: z.string().prefault('玩家透明档案：按女性角色设定生成'),
                罩杯: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
                胸部: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
                臀部: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
                腿部: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
              })
              .prefault({}),
            着装: z.object({
              发型: z.string(),
              上装: z.string(),
              下装: z.string(),
              鞋袜: z.string(),
              配饰: z.string(),
              随身物: z.string(),
              状态细节: z.string(),
            }),
          })
          .prefault({
            容貌: '未记录',
            身材: '未记录',
            身体特征: {
              身高: '玩家透明档案：按女性角色设定生成',
              罩杯: '玩家透明档案：按女性角色设定生成，保持非露骨表达',
              胸部: '玩家透明档案：按女性角色设定生成，保持非露骨表达',
              臀部: '玩家透明档案：按女性角色设定生成，保持非露骨表达',
              腿部: '玩家透明档案：按女性角色设定生成，保持非露骨表达',
            },
            着装: {
              发型: '未记录',
              上装: '未记录',
              下装: '未记录',
              鞋袜: '未记录',
              配饰: '未记录',
              随身物: '未记录',
              状态细节: '未记录',
            },
        }),
        互动记录: z.object({
          最近互动: z.string(),
          当前动作: z.string(),
        }),
        关系指标: z.object({
          好感度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
          信任度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
          警觉度: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
        }),
        亲密档案: z
          .object({
            小穴: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
            肛门: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
            怀孕情况: z.string().prefault('玩家透明档案：按女性角色设定生成'),
            特殊性技: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
            性癖喜好: z.string().prefault('玩家透明档案：按女性角色设定生成，保持非露骨表达'),
          })
          .prefault({}),
        当前状态: z.string(),
        对杨世发态度: z.string(),
        心理话: z.string().prefault('暂无可由杨世发合理推测的心理话'),
      }),
    )
    .transform(data =>
      _(data)
        .entries()
        .filter(([, npc]) => ['女', '女性'].includes(npc.基本信息.性别))
        .takeRight(8)
        .fromPairs()
        .value(),
    )
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
