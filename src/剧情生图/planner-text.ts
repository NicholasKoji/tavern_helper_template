/** 仅处理消息字符串，不读取页面 DOM，也不渲染前端代码。 */
export function cleanPlannerStory(raw: string): string {
  let text = raw ?? '';
  // 这些块是协议/推理/界面数据，不属于剧情。未闭合块丢弃到消息末尾。
  const excluded = 'thinking|think|analysis|UpdateVariable|JSONPatch|SUOT|script|style|iframe';
  text = text.replace(new RegExp(`<(${excluded})\\b[^>]*>[\\s\\S]*?(?:<\\/\\1\\s*>|$)`, 'gi'), '');
  text = text.replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  // 保留普通文字围栏；只去掉代码/数据围栏，避免误删包在 text 中的剧情。
  text = text.replace(/(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)(?:\n\1[^\n]*|$)/g, (_all, _fence, lang, body) => {
    if (
      /^(?:html?|javascript|js|typescript|ts|jsx|tsx|css|scss|json5?|ya?ml|xml|vue|python|py|sql|sh|bash)\b/i.test(
        lang.trim(),
      )
    )
      return '';
    if (/<(?:!doctype|html|body|script|style)\b|^\s*(?:import\s|const\s|let\s|function\s)/im.test(body)) return '';
    return body;
  });
  // 消息中的 HTML/自定义组件仅去标签，段落容器转换为换行。
  text = text.replace(/<\/?(?:p|div|section|article|br|li|h[1-6])\b[^>]*>/gi, '\n');
  text = text.replace(/<\/?[A-Za-z][^>]*>/g, '');
  // 与正文可见文字接近的轻量 Markdown 清理，不执行显示侧正则。
  text = text.replace(/!\[[^\]]*\]\([^\n]*?\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^\n]*?\)/g, '$1');
  text = text.replace(/^\s{0,3}(?:#{1,6}\s+|>\s?)/gm, '');
  text = text.replace(/(\*\*|__|~~)([^\n]+?)\1/g, '$2');
  text = text.replace(/\*([^*\n]+)\*/g, '$1').replace(/`([^`\n]+)`/g, '$1');
  return text.replace(/\n[\t ]*\n(?:[\t ]*\n)+/g, '\n\n').trim();
}

export function preparePlannerStory(raw: string, source: 'ai_output' | 'user_input', depth: number): string {
  // 先去非剧情块，避免显示代码/变量经过正则后变成难以识别的纯文本。
  let text = cleanPlannerStory(raw);
  if (!text) return '';
  try {
    text = formatAsTavernRegexedString(text, source, 'prompt', { depth });
  } catch (error) {
    console.warn('[剧情生图] 提示词侧正则处理失败，使用已清理的消息正文', error);
  }
  return cleanPlannerStory(text);
}
