const GITHUB_OWNER = "opix-maker";
const GITHUB_REPO = "Forward";
const GITHUB_BRANCH = "main";
const BASE_DATA_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/imdb-data-platform/dist`;
const IMG_BASE_POSTER = 'https://image.tmdb.org/t/p/w500';
const IMG_BASE_BACKDROP = 'https://image.tmdb.org/t/p/w780';
const ITEMS_PER_PAGE = 30;
const CURRENT_YEAR = new Date().getFullYear();
const DEBUG_LOG = true;

console.log(`[IMDb-v2] 脚本初始化 v2.0.0 `);

// --- 辅助函数 ---

// 构建图片 URL
function buildImageUrl(baseUrl, path) {
  if (!path || typeof path !== 'string') { return null; }
  if (path.startsWith('http://') || path.startsWith('https://')) { return path; }
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return baseUrl + cleanPath;
}

// 处理枚举选项
function processEnumOptions(options, allValue = "all", allTitle = "全部", allLast = false) {
  let processed = [...options];
  const allIndex = processed.findIndex(opt => opt.value === allValue);
  let allItem = null;
  if (allIndex > -1) {
    allItem = processed.splice(allIndex, 1)[0];
    allItem.title = allTitle;
  } else {
    allItem = { title: allTitle, value: allValue };
  }
  // 年份降序，其他按中文拼音升序
  if (options.length > 0 && options.some(opt => /^\d{4}$/.test(opt.value))) {
    processed.sort((a, b) => parseInt(b.value) - parseInt(a.value));
  } else {
    processed.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
  }
  if (allLast) {
    processed.push(allItem);
  } else {
    processed.unshift(allItem);
  }
  return processed;
}

// --- 参数定义 ---

const pageParam = { name: "page", title: "页码", type: "page", value: "1" };

// 排序选项 (hs=热度, r=评分, d=默认/流行度)
const sortOptions = [
  { title: "🔥综合热度", value: "hs_desc" }, { title: "👍评分", value: "r_desc" }, { title: "默认排序", value: "d_desc" }
];
const sortParam = (defaultValue = "hs_desc") => ({ name: "sort", title: "排序方式", type: "enumeration", value: defaultValue, enumOptions: sortOptions });

// 年份选项
const yearOptionsRaw = [];
for (let y = CURRENT_YEAR; y >= 1990; y--) { yearOptionsRaw.push({ title: `${y} 年`, value: String(y) }); }
// 默认今年, "全部"放在最后, 降序排列
const yearEnumParam = { name: "year", title: "年份", type: "enumeration", value: String(CURRENT_YEAR), description: "选择特定年份", enumOptions: processEnumOptions(yearOptionsRaw, "all", "全部年份", true) };

// 地区选项
const regionOptionsRefined = [
  { title: "中国大陆", value: "country:cn" }, { title: "美国", value: "country:us" }, { title: "英国", value: "country:gb" },
  { title: "日本", value: "country:jp" }, { title: "韩国", value: "country:kr" }, { title: "欧美", value: "region:us-eu" },
  { title: "香港", value: "country:hk" }, { title: "台湾", value: "country:tw" },
];
// 用于电影/剧集/动画页面的地区选择器 (默认"全部"，"全部"在最前)
const regionParamSelect = { name: "region", title: "选择地区/语言", type: "enumeration", value: "all", enumOptions: processEnumOptions(regionOptionsRefined, "all", "全部地区", false) };
// 用于热门/分类/年份页面的地区过滤器 (默认"全部"，"全部"在最后)
const regionFilterParam = { name: "region", title: "选择地区/语言", type: "enumeration", value: "all", enumOptions: processEnumOptions(regionOptionsRefined, "all", "全部地区", true) };

// 分类/主题选项
const genreMap = [
  { title: "爱情", value: "genre:爱情" }, { title: "冒险", value: "genre:冒险" }, { title: "悬疑", value: "genre:悬疑" }, { title: "惊悚", value: "genre:惊悚" }, { title: "恐怖", value: "genre:恐怖" }, { title: "科幻", value: "genre:科幻" },
  { title: "奇幻", value: "genre:奇幻" }, { title: "动作", value: "genre:动作" }, { title: "喜剧", value: "genre:喜剧" }, { title: "剧情", value: "genre:剧情" }, { title: "历史", value: "genre:历史" }, { title: "战争", value: "genre:战争" }, { title: "犯罪", value: "genre:犯罪" },
];
const themeOptionsRaw = [
  { title: "赛博朋克", value: "theme:cyberpunk" }, { title: "太空歌剧", value: "theme:space-opera" }, { title: "时间旅行", value: "theme:time-travel" }, { title: "末世废土", value: "theme:post-apocalyptic" }, { title: "机甲", value: "theme:mecha" }, { title: "丧尸", value: "theme:zombie" }, { title: "怪物", value: "theme:monster" }, { title: "灵异", value: "theme:ghost" }, { title: "魔法", value: "theme:magic" }, { title: "黑帮", value: "theme:gangster" }, { title: "黑色电影", value: "theme:film-noir" }, { title: "连环杀手", value: "theme:serial-killer" }, { title: "仙侠", value: "theme:xianxia" }, { title: "怪兽(Kaiju)", value: "theme:kaiju" }, { title: "异世界", value: "theme:isekai" },
  { title: "侦探推理", value: "theme:whodunit" }, { title: "谍战", value: "theme:spy" }, { title: "律政", value: "theme:courtroom" }, { title: "校园/日常", value: "theme:slice-of-life" }, { title: "武侠", value: "theme:wuxia" }, { title: "超级英雄", value: "theme:superhero" }
];
const allCategoryOptions = [...genreMap, ...themeOptionsRaw];
// 默认爱情, "全部"在最后
const categoryParam = { name: "category", title: "选择分类/主题", type: "enumeration", value: "genre:爱情", enumOptions: processEnumOptions(allCategoryOptions, "all", "全部分类/主题", true) };

// 内容类型 (固定顺序)
const contentTypeParam = {
  name: "contentType", title: "内容分类", type: "enumeration", value: "all",
  enumOptions: [
    { title: "🔥全部类型", value: "all" }, { title: "🎬电影", value: "movie" },
    { title: "📺剧集", value: "tv" }, { title: "✨动画", value: "anime" }
  ]
};

// --- 元数据 ---
var WidgetMetadata = {
  id: "imdb_discovery_final_v2",
  title: "IMDb 分类资源 v2",
  description: "聚合 IMDb 热门影视资源",
  author: "Autism",
  site: "https://github.com/opix-maker/Forward",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 36000,
  cacheDuration: 3600,
  modules: [
    { title: "🆕 近期热门", functionName: "listRecentHot", params: [contentTypeParam, regionFilterParam, sortParam("hs_desc"), pageParam], cacheDuration: 1800, requiresWebView: false },
    { title: "🎭 分类/主题", functionName: "listByCategory", params: [categoryParam, contentTypeParam, regionFilterParam, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
    { title: "📅 按年份浏览", functionName: "listByYear", params: [yearEnumParam, contentTypeParam, regionFilterParam, sortParam("d_desc"), pageParam], cacheDuration: 3600, requiresWebView: false },
    { title: "🎬 电影", functionName: "listMovies", params: [regionParamSelect, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
    { title: "📺 剧集", functionName: "listTVSeries", params: [regionParamSelect, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
    { title: "✨ 动画", functionName: "listAnime", params: [regionParamSelect, sortParam(), pageParam], cacheDuration: 3600, requiresWebView: false },
  ]
};


// --- 缓存 ---
let cachedData = {}; // 用于缓存单个分页文件的请求结果

// --- 核心数据获取 ---

// 缓存清除器，用于绕过 GitHub CDN 缓存
function getCacheBuster() {
  return Math.floor(Date.now() / (1000 * 60 * 30)); // 30 分钟更新一次
}

// 获取预先分页的数据
async function fetchPagedData(shardPath) {
  if (!shardPath || typeof shardPath !== 'string' || !shardPath.endsWith('.json')) {
    console.error(`[IMDb-v2 ERROR] 无效的分片路径: ${shardPath}`);
    return [];
  }

  // 构建完整 URL
  const rawUrl = `${BASE_DATA_URL}/${shardPath}?cache_buster=${getCacheBuster()}`;
  const encodedUrl = encodeURI(rawUrl); // 编码 URL

  // 检查内存缓存
  if (cachedData[encodedUrl]) {
    if (DEBUG_LOG) console.log(`[IMDb-v2 DEBUG] 内存缓存命中: ${shardPath}`);
    return cachedData[encodedUrl];
  }

  if (DEBUG_LOG) console.log(`[IMDb-v2 DEBUG] 正在获取分页数据: ${encodedUrl}`);
  let response;
  try {
    // 发起网络请求，超时时间可以短一些，因为文件很小
    response = await Widget.http.get(encodedUrl, { timeout: 15000, headers: { 'User-Agent': 'ForwardWidget/IMDb-v2' } });
  } catch (e) {
    console.error(`[IMDb-v2 ERROR] 网络请求失败 ${encodedUrl}: ${e.message}`);
    // 如果是 404 错误，可能是页码超出范围，返回空
    if (e.message.includes('404')) {
      if (DEBUG_LOG) console.log(`[IMDb-v2 INFO] 数据未找到 (404)，可能页码超出范围: ${encodedUrl}`);
      return [];
    }
    throw new Error(`网络请求失败: ${e.message || '未知网络错误'}`);
  }

  // 检查响应状态
  if (!response || response.statusCode !== 200 || !response.data) {
    // 404 是正常的，表示该页不存在
    if (response && response.statusCode === 404) {
      if (DEBUG_LOG) console.log(`[IMDb-v2 INFO] 数据未找到 (404)，可能页码超出范围: ${encodedUrl}`);
      return [];
    }
    console.error(`[IMDb-v2 ERROR] 获取数据响应异常. Status: ${response ? response.statusCode : 'N/A'}, URL: ${encodedUrl}`);
    throw new Error(`获取数据失败 (Status: ${response ? response.statusCode : 'N/A'})`);
  }

  // 解析数据并缓存
  const data = Array.isArray(response.data) ? response.data : [];
  cachedData[encodedUrl] = data;
  return data;
}


// --- 核心处理 ---

// 将数据源格式映射为小组件格式
function mapToWidgetItem(item) {
  // 数据源字段：id, t(title), p(poster), b(backdrop), r(rating), y(year), rd(release_date), mt(mediaType), o(overview)
  if (!item || typeof item.id === 'undefined' || item.id === null) return null;

  let mediaType = item.mt;
  // 客户端通常只需要 movie 或 tv
  if (mediaType === 'anime' || mediaType === 'tv') {
    mediaType = 'tv'; // 将 anime 和 tv 都映射为 tv 类型
  } else {
    mediaType = 'movie'; // 其他都映射为 movie
  }

  const posterUrl = buildImageUrl(IMG_BASE_POSTER, item.p);

  // 优先使用 rd (完整日期), 否则使用 y (年份) + 01-01
  const finalReleaseDate = item.rd ? item.rd : (item.y ? `${String(item.y)}-01-01` : '');

  const widgetItem = {
    id: String(item.id),
    type: "tmdb",
    title: item.t || '未知标题',
    posterPath: posterUrl,
    backdropPath: buildImageUrl(IMG_BASE_BACKDROP, item.b),
    coverUrl: posterUrl,
    releaseDate: finalReleaseDate,
    mediaType: mediaType,
    rating: typeof item.r === 'number' ? item.r.toFixed(1) : '0.0',
    description: item.o || '',
    link: null, genreTitle: "", duration: 0, durationText: "", episode: 0, childItems: []
  };
  return widgetItem;
}

// 处理数据 映射
function processData(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map(mapToWidgetItem).filter(Boolean);
}

// --- 路径辅助函数 ---

// 获取和解析排序和页码参数
function getSortAndPage(params) {
  const sortKeyRaw = params.sort || 'd_desc';
  // 提取排序键 (hs, r, d)
  const sortKey = typeof sortKeyRaw === 'string' ? sortKeyRaw.split('_desc')[0] : 'd';
  // 提取页码
  const page = Math.max(1, parseInt(params.page || "1", 10));
  return { sortKey, page };
}

// 构建最终的分页文件路径
function buildPagedPath(basePath, sortKey, page) {
  // 替换路径中的冒号 (如 country:cn -> country_cn)
  const cleanBasePath = String(basePath).replace(':', '_');
  return `${cleanBasePath}/by_${sortKey}/page_${page}.json`;
}

// --- 核心请求处理 ---

// 通用请求处理函数 负责构建路径、获取数据、处理分页
async function fetchAndProcess(basePath, params) {
  const { sortKey, page } = getSortAndPage(params);
  const fullPath = buildPagedPath(basePath, sortKey, page);

  if (DEBUG_LOG) console.log(`[IMDb-v2 DEBUG] 请求参数: Path=${fullPath}, Sort=${sortKey}, Page=${page}`);

  try {
    // 获取数据
    const data = await fetchPagedData(fullPath);
    // 映射为小组件格式
    const items = processData(data);
    if (items.length === ITEMS_PER_PAGE) {
      params.nextPageParams = { ...params, page: String(page + 1) };
    } else {
      params.nextPageParams = null; // 没有下一页了
    }

    return items;
  } catch (e) {
    console.error(`[IMDb-v2 ERROR] 处理请求时出错 "${fullPath}":`, e.message || e, e.stack);
    throw new Error(`加载数据失败: ${e.message || '未知错误'}`);
  }
}


// --- 模块入口函数 (根据 build.js 生成的路径结构进行调整) ---

// 路径格式: hot/{contentType}/{region}
async function listRecentHot(params) {
  const type = params.contentType || 'all';
  const region = params.region || 'all';
  const basePath = `hot/${type}/${region.replace(':', '_')}`;
  return fetchAndProcess(basePath, params);
}

// 路径格式: tag/{category}/{contentType}/{region}
async function listByCategory(params) {
  const category = params.category || 'all';
  const type = params.contentType || 'all';
  const region = params.region || 'all';
  const basePath = `tag/${category.replace(':', '_')}/${type}/${region.replace(':', '_')}`;
  return fetchAndProcess(basePath, params);
}

// 路径格式: year/{year}/{contentType}/{region}
async function listByYear(params) {
  const year = params.year || 'all';
  const type = params.contentType || 'all';
  const region = params.region || 'all';
  const basePath = `year/${year}/${type}/${region.replace(':', '_')}`;
  return fetchAndProcess(basePath, params);
}

// 路径格式: movies/{region}
async function listMovies(params) {
  const region = params.region || 'all';
  const basePath = `movies/${region.replace(':', '_')}`;
  return fetchAndProcess(basePath, params);
}

// 路径格式: tvseries/{region}
async function listTVSeries(params) {
  const region = params.region || 'all';
  const basePath = `tvseries/${region.replace(':', '_')}`;
  return fetchAndProcess(basePath, params);
}

// 路径格式: anime/{region}
async function listAnime(params) {
  const region = params.region || 'all';
  const basePath = `anime/${region.replace(':', '_')}`;
  return fetchAndProcess(basePath, params);
}

console.log("[IMDb-v2] 脚本加载成功.");