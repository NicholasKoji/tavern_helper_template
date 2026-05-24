export const Schema = z.object({
  主角: z
    .object({
      姓名: z.string().prefault('杨世发'),
      年龄: z.coerce.number().transform(value => _.clamp(value, 0, 120)).prefault(18),
      san值: z.coerce.number().transform(value => _.clamp(value, 0, 100)).prefault(100),
    })
    .prefault({}),

  当前场景: z
    .object({
      时间: z
        .object({
          年: z.coerce.number().transform(value => _.clamp(value, 0, 9999)).prefault(2186),
          月: z.coerce.number().transform(value => _.clamp(value, 1, 12)).prefault(6),
          日: z.coerce.number().transform(value => _.clamp(value, 1, 31)).prefault(14),
          时: z.coerce.number().transform(value => _.clamp(value, 0, 23)).prefault(14),
          分: z.coerce.number().transform(value => _.clamp(value, 0, 59)).prefault(35),
        })
        .prefault({}),
      地点: z
        .object({
          一级区域: z.string().prefault('埃斯图拉'),
          二级区域: z.string().prefault('社会管理局'),
          三级区域: z.string().prefault('拘留室'),
        })
        .prefault({}),
      天气: z
        .object({
          概况: z.string().prefault('阴天'),
          气温: z
            .object({
              数值: z.coerce.number().transform(value => _.clamp(value, -80, 80)).prefault(24),
              单位: z.string().prefault('°C'),
            })
            .prefault({}),
          风: z.string().prefault('海风偏湿'),
          体感: z.string().prefault('室外潮湿，室内空气略闷。'),
        })
        .prefault({}),
      环境: z.string().prefault('金属询问桌横在房间中央，封闭灯光照得桌面发白，空气里残留微甜的消毒剂气味。'),
    })
    .prefault({}),

  待办事项: z
    .object({
      主要: z.string().prefault('等待社会管理局对杨世发的无档案情况作出初步安置决定。'),
      次要: z.string().prefault('在赵锋离开期间，与苏晴进行第一次直接交流。'),
    })
    .prefault({}),

  骑士: z
    .record(
      z.string().describe('骑士姓名'),
      z
        .object({
          年龄: z.coerce.number().transform(value => _.clamp(value, 0, 120)).prefault(18),
          身份: z.string().prefault('骑士'),
          外貌: z.string().prefault(''),
          性格: z.string().prefault(''),
          态度: z.string().prefault(''),
          好感度: z.coerce.number().transform(value => _.clamp(value, -100, 100)).prefault(0),
          当前心理: z.string().prefault(''),
          当前动作: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),

  女骑: z
    .record(
      z.string().describe('女骑姓名'),
      z
        .object({
          年龄: z.coerce.number().transform(value => _.clamp(value, 0, 120)).prefault(18),
          身份: z.string().prefault('女骑'),
          所属骑士: z.string().prefault(''),
          所属关系: z.string().prefault(''),
          关系背景: z.string().prefault(''),
          外貌: z
            .object({
              体型: z.string().prefault(''),
              头发: z.string().prefault(''),
              眉眼: z.string().prefault(''),
              鼻梁: z.string().prefault(''),
              唇口: z.string().prefault(''),
              脸部轮廓: z.string().prefault(''),
              皮肤: z.string().prefault(''),
            })
            .prefault({}),
          身材: z
            .object({
              胸部: z
                .object({
                  身材描述: z.string().prefault(''),
                  罩杯: z.string().prefault(''),
                  当前状态: z.string().prefault(''),
                })
                .prefault({}),
              臀部: z
                .object({
                  身材描述: z.string().prefault(''),
                  当前状态: z.string().prefault(''),
                })
                .prefault({}),
              足部: z
                .object({
                  身材描述: z.string().prefault(''),
                  当前状态: z.string().prefault(''),
                })
                .prefault({}),
            })
            .prefault({}),
          性格: z.string().prefault(''),
          态度: z.string().prefault(''),
          好感度: z.coerce.number().transform(value => _.clamp(value, -100, 100)).prefault(0),
          当前心理: z.string().prefault(''),
          当前动作: z.string().prefault(''),
          体力: z.coerce.number().transform(value => _.clamp(value, 0, 100)).prefault(100),
          装备: z
            .record(
              z.string().describe('装备名称'),
              z
                .object({
                  描述: z.string().prefault(''),
                  状态: z.string().prefault(''),
                })
                .prefault({}),
            )
            .prefault({}),
          机动能力: z
            .object({
              最高时速: z
                .object({
                  数值: z.coerce.number().transform(value => _.clamp(value, 0, 150)).prefault(0),
                  单位: z.string().prefault('km/h'),
                })
                .prefault({}),
              巡航距离: z
                .object({
                  数值: z.coerce.number().transform(value => _.clamp(value, 0, 300)).prefault(0),
                  单位: z.string().prefault('km'),
                })
                .prefault({}),
              承载稳定: z
                .object({
                  数值: z.coerce.number().transform(value => _.clamp(value, 0, 10)).prefault(0),
                  单位: z.string().prefault('m/s²'),
                })
                .prefault({}),
              操控响应: z
                .object({
                  数值: z.coerce.number().transform(value => _.clamp(value, 0, 5)).prefault(0),
                  单位: z.string().prefault('s'),
                })
                .prefault({}),
              动力转化效率: z
                .object({
                  数值: z.coerce.number().transform(value => _.clamp(value, 0, 100)).prefault(0),
                  单位: z.string().prefault('百分比'),
                })
                .prefault({}),
            })
            .prefault({}),
        })
        .prefault({}),
    )
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;