
const formatDate = (dateString,preFix='') => {
  const now = new Date();
  const targetDate = new Date(dateString);
  const diffMs = now - targetDate;
  const diffSeconds = Math.floor(diffMs / 1000);

  // 超过7天（604800秒）显示日期
  if (diffSeconds > 604800) {
    return targetDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })+preFix;
  }

  // 7天内：根据时间差返回 "XX前"
  if (diffSeconds < 60) {
    return `${diffSeconds}秒前${preFix}`;
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}分钟前${preFix}`;
  } else if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)}小时前${preFix}`;
  } else {
    return `${Math.floor(diffSeconds / 86400)}天前${preFix}`;
  }
};
export  {formatDate};