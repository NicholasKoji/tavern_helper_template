export const Schema = z.object({
  当前场景: z.enum(['现实', '虚拟']).prefault('现实'),
  现实场景状态: z
    .object({
      日期: z
        .object({
          年: z.coerce
            .number()
            .transform(value => _.clamp(value, 2004, 2200))
            .prefault(2071),
          月: z.coerce
            .number()
            .transform(value => _.clamp(value, 1, 12))
            .prefault(8),
          日: z.coerce
            .number()
            .transform(value => _.clamp(value, 1, 31))
            .prefault(18),
        })
        .prefault({}),
      时间: z
        .object({
          时: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 23))
            .prefault(14),
          分: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 59))
            .prefault(30),
        })
        .prefault({}),
      地点: z
        .object({
          一级区域: z.string().prefault('亚洲行政区'),
          二级区域: z.string().prefault('岭南自治州'),
          三级地点: z.string().prefault('广州天河区·杨世发公寓深潜室'),
        })
        .prefault({}),
    })
    .prefault({}),
  虚拟场景状态: z
    .object({
      虚拟世界编号: z.string().prefault('PSSEA-LN-2071-封存任务-001'),
      时代背景: z.string().prefault('现实镜像实验世界，具体实验政策与社会阶段尚未公开'),
      社会氛围: z.string().prefault('任务结束后仍残留高压、压抑和不稳定感'),
      日期: z
        .object({
          年: z.coerce
            .number()
            .transform(value => _.clamp(value, 2004, 2200))
            .prefault(2071),
          月: z.coerce
            .number()
            .transform(value => _.clamp(value, 1, 12))
            .prefault(8),
          日: z.coerce
            .number()
            .transform(value => _.clamp(value, 1, 31))
            .prefault(18),
        })
        .prefault({}),
      时间: z
        .object({
          时: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 23))
            .prefault(14),
          分: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 59))
            .prefault(20),
        })
        .prefault({}),
      地点: z
        .object({
          一级区域: z.string().prefault('PSSEA现实镜像实验世界'),
          二级区域: z.string().prefault('封存政策实验区'),
          三级地点: z.string().prefault('退出前坐标已封存'),
        })
        .prefault({}),
    })
    .prefault({}),
  当前任务: z
    .object({
      名称: z.string().prefault('强制休假30日'),
      类型: z.string().prefault('休假'),
      状态: z.string().prefault('进行中'),
      目标: z.string().prefault('在强制休假期间恢复深潜后心理状态'),
      进展: z.string().prefault('戴安娜正在照护刚退出深潜任务的杨世发'),
    })
    .prefault({}),
  携带物: z
    .object({
      现实: z
        .record(
          z.string().describe('现实携带物名称'),
          z.object({
            描述: z.string().prefault('待记录'),
          }),
        )
        .prefault({}),
      虚拟: z
        .record(
          z.string().describe('虚拟携带物名称'),
          z.object({
            描述: z.string().prefault('待记录'),
          }),
        )
        .prefault({}),
    })
    .prefault({}),
  主角: z
    .object({
      基础信息: z
        .object({
          姓名: z.string().prefault('杨世发'),
          年龄: z.coerce
            .number()
            .transform(value => _.clamp(value, 0, 200))
            .prefault(23),
          性别: z.string().prefault('男'),
          现实身份: z.string().prefault('UEG虚拟政策评审员（VPA）'),
          所属机构: z.string().prefault('PSSEA岭南自治州分部'),
        })
        .prefault({}),
      外貌: z
        .object({
          身高: z.string().prefault('178cm'),
          体型: z.string().prefault('常健身，精壮型，穿衣显瘦，脱衣有肉'),
          面容气质: z.string().prefault('眉清目秀，不笑时冷静，笑起来容易让人放下戒备'),
          身体特征: z.string().prefault('左耳垂有一颗小痣，双手掌心有长期举铁磨出的薄茧'),
        })
        .prefault({}),
      现实身体: z
        .object({
          当前状态: z.string().prefault('深潜后脸色发白，衣服被冷汗浸透，颈侧和手腕有神经接口压痕'),
          穿着: z
            .object({
              上装: z.string().prefault('被冷汗浸湿的深灰色居家T恤'),
              下装: z.string().prefault('藏青色宽松运动长裤'),
              鞋子: z.string().prefault('未穿鞋'),
            })
            .prefault({}),
        })
        .prefault({}),
      虚拟化身: z
        .object({
          当前身份: z.string().prefault('PSSEA岭南分部紧急探索任务中的VPA杨世发'),
          当前状态: z.string().prefault('已退出深潜，虚拟化身停留在任务结算后的退出状态'),
          穿着: z
            .object({
              上装: z.string().prefault('PSSEA标准深色制服上装'),
              下装: z.string().prefault('PSSEA标准深色制服长裤'),
              鞋子: z.string().prefault('黑色任务靴'),
            })
            .prefault({}),
        })
        .prefault({}),
    })
    .prefault({}),
  NPC序列: z
    .record(
      z.string().describe('NPC名称'),
      z.object({
        基础信息: z
          .object({
            姓名: z.string().prefault('待记录'),
            认知类型: z.enum(['现实世界', '虚拟世界']).prefault('虚拟世界'),
            好感度: z.coerce
              .number()
              .transform(value => _.clamp(value, 0, 100))
              .prefault(50),
            与主角关系: z.string().prefault('待记录'),
            当前身份: z.string().prefault('待记录'),
          })
          .prefault({}),
        外貌: z
          .object({
            身高: z.string().prefault('待记录'),
            罩杯: z.string().prefault('无'),
            体型: z.string().prefault('待记录'),
            面容气质: z.string().prefault('待记录'),
            身体特征: z.string().prefault('待记录'),
          })
          .prefault({}),
        性格: z
          .object({
            底色: z.string().prefault('待记录'),
            主色调: z.string().prefault('待记录'),
          })
          .prefault({}),
        现实身体: z
          .object({
            当前状态: z.string().prefault('待记录'),
            穿着: z
              .object({
                上装: z.string().prefault('待记录'),
                下装: z.string().prefault('待记录'),
                内衣: z.string().prefault('待记录'),
                袜子: z.string().prefault('待记录'),
                鞋子: z.string().prefault('待记录'),
                配饰: z.string().prefault('待记录'),
              })
              .prefault({}),
          })
          .optional(),
        虚拟化身: z
          .object({
            当前身份: z.string().prefault('待记录'),
            当前状态: z.string().prefault('待记录'),
            穿着: z
              .object({
                上装: z.string().prefault('待记录'),
                下装: z.string().prefault('待记录'),
                内衣: z.string().prefault('待记录'),
                袜子: z.string().prefault('待记录'),
                鞋子: z.string().prefault('待记录'),
                配饰: z.string().prefault('待记录'),
              })
              .prefault({}),
          })
          .prefault({}),
        当前想法: z.string().prefault('待记录'),
      }),
    )
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;
