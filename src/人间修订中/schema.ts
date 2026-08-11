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
      主角启用: z.boolean().prefault(true),
      叙事视角: z
        .enum(['第二人称', '第三人称上帝', '第三人称限定', '第一人称玩家', '第一人称角色'])
        .prefault('第三人称限定'),
      叙事文风: z.enum(['细腻写实', '通用白描', '轻小说', '古风', '西幻', '漫画分镜', '微色情']).prefault('细腻写实'),
      视角角色: z.string().prefault(''),
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
        .object({
          世界规则: z.record(z.string().describe('规则名'), z.string().describe('规则内容')).prefault({}),
          区域规则: z
            .record(
              z.string().describe('区域名'),
              z.record(z.string().describe('规则名'), z.string().describe('规则内容')),
            )
            .prefault({}),
          个人规则: z
            .record(
              z.string().describe('对象名'),
              z.record(z.string().describe('规则名'), z.string().describe('规则内容')),
            )
            .prefault({}),
        })
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
              年龄: z.coerce
                .number()
                .transform(value => _.clamp(value, 0, 200))
                .prefault(18),
              身份: z.string().prefault(''),
              关系定位: z.string().prefault(''),
              好感度: z.coerce
                .number()
                .transform(value => _.clamp(value, 0, 100))
                .prefault(50),
            })
            .prefault({}),
          外貌: z
            .object({
              身高: z.string().prefault('待记录'),
              罩杯: z.string().prefault('待记录'),
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
          当前状态: z.string().prefault('待记录'),
          穿着: z
            .object({
              上装: z.string().prefault('待记录'),
              下装: z.string().prefault('待记录'),
              内衣: z.string().prefault('待记录'),
              袜子: z.string().prefault('待记录'),
              鞋子: z.string().prefault('待记录'),
              配饰: z.string().prefault('无'),
            })
            .prefault({}),
          当前想法: z.string().prefault('待记录'),
          私密状态: z
            .record(
              z.string().describe('部位名称'),
              z
                .object({
                  外观描述: z.string().prefault('待记录'),
                  当前状态: z.string().prefault('待记录'),
                })
                .prefault({}),
            )
            .prefault({}),
        })
        .prefault({}),
    )
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
