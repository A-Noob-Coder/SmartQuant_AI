import { Strategy } from '../types';

export const PRESET_STRATEGIES: Strategy[] = [
  {
    id: 'strat-dual-ma',
    name: '双均线交叉择时策略 v1.0',
    category: '趋势跟踪',
    description: '经典的均线金叉做多、死叉平仓策略。适合捕捉大级别单边趋势行情，通过短周期均线与长周期均线关系实现自动择时。',
    author: 'SmartQuant 团队',
    version: '1.0.0',
    stockSymbol: '600519.SH',
    parameters: {
      short_window: 5,
      long_window: 20,
    },
    code: `def initialize(context):
    """
    策略初始化函数：设置标的、均线参数及初始仓位状态
    """
    # 交易标的 (贵州茅台)
    context.stock = "600519.SH"
    # 短期均线周期
    context.short_window = 5
    # 长期均线周期
    context.long_window = 20

def handle_data(context, data):
    """
    每个 Bar 触发的交易逻辑 (日线级别)
    """
    # 获取历史收盘价数据 (近 35 个 Bar)
    prices = data.history(context.stock, 'close', 35)
    if len(prices) < context.long_window:
        return
        
    # 计算短期均线与长期均线
    ma_short = prices[-context.short_window:].mean()
    ma_long = prices[-context.long_window:].mean()
    
    # 均线金叉 (短均线上穿长均线) -> 全仓买入
    if ma_short > ma_long:
        order_target_percent(context.stock, 1.0)
    # 均线死叉 (短均线下穿长均线) -> 清仓止盈/止损
    elif ma_short < ma_long:
        order_target_percent(context.stock, 0.0)
`,
  },
  {
    id: 'strat-rsi-reversion',
    name: 'RSI 超买超卖反转策略 v1.2',
    category: '均值回归',
    description: '基于相对强弱指标 (RSI) 的动量摆动策略。当 RSI 跌入超卖区 (RSI < 28) 时逢低分批建仓，升入超买区 (RSI > 72) 时分批获利离场。',
    author: 'SmartQuant 团队',
    version: '1.2.0',
    stockSymbol: '300750.SZ',
    parameters: {
      rsi_period: 14,
      oversold_threshold: 28,
      overbought_threshold: 72,
    },
    code: `def initialize(context):
    """
    RSI 动量超买超卖反转策略初始化
    """
    context.stock = "300750.SZ"  # 宁德时代
    context.rsi_period = 14
    context.oversold = 28        # 超卖阈值 (买入区)
    context.overbought = 72      # 超买阈值 (卖出区)

def handle_data(context, data):
    """
    计算 RSI 摆动指标并执行均值回归交易
    """
    prices = data.history(context.stock, 'close', 40)
    if len(prices) < context.rsi_period + 1:
        return
        
    # 计算日收益增量与 RSI
    deltas = prices[1:] - prices[:-1]
    gains = deltas.copy()
    losses = deltas.copy()
    gains[gains < 0] = 0
    losses[losses > 0] = 0
    losses = abs(losses)
    
    avg_gain = gains[-context.rsi_period:].mean()
    avg_loss = losses[-context.rsi_period:].mean()
    
    if avg_loss == 0:
        rsi = 100
    else:
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
    # 策略触发信号
    if rsi < context.oversold:
        # 极度超卖，胜率较高 -> 满仓进场
        order_target_percent(context.stock, 1.0)
    elif rsi > context.overbought:
        # 极度超买，动能耗尽 -> 清仓离场
        order_target_percent(context.stock, 0.0)
`,
  },
  {
    id: 'strat-bollinger-breakout',
    name: '布林带自适应通道突破策略 v1.5',
    category: '通道突破',
    description: '利用布林带 (Bollinger Bands) 上下轨自适应捕捉标的波动率扩张。突破上轨强力跟进，回落跌破中轨减仓，跌破下轨硬止损。',
    author: 'SmartQuant 团队',
    version: '1.5.0',
    stockSymbol: '002594.SZ',
    parameters: {
      bb_window: 20,
      bb_std_dev: 2.0,
    },
    code: `import numpy as np

def initialize(context):
    """
    布林通道突破策略初始化
    """
    context.stock = "002594.SZ"  # 比亚迪
    context.window = 20
    context.num_std = 2.0        # 2倍标准差通道

def handle_data(context, data):
    """
    布林带波动率通道突破逻辑
    """
    prices = data.history(context.stock, 'close', 35)
    if len(prices) < context.window:
        return
        
    window_prices = prices[-context.window:]
    ma_mid = window_prices.mean()
    std = window_prices.std()
    
    upper_band = ma_mid + (context.num_std * std)
    lower_band = ma_mid - (context.num_std * std)
    current_price = prices[-1]
    
    # 突破布林带上轨：多头主升浪启动
    if current_price > upper_band:
        order_target_percent(context.stock, 1.0)
    # 回撤跌破中轨均线：趋势动能衰竭，平仓避险
    elif current_price < ma_mid:
        order_target_percent(context.stock, 0.0)
`,
  },
  {
    id: 'strat-atr-trailing-stop',
    name: 'ATR 波动率动态止损增强策略 v2.1',
    category: '风控增强',
    description: '在均线择时的基础上引入 ATR (真实波幅) 动态跟踪止损与均线死区过滤，大幅降低震荡行情频繁假突破的摩擦损耗。',
    author: 'SmartQuant AI 架构师',
    version: '2.1.0',
    stockSymbol: '600519.SH',
    parameters: {
      short_w: 5,
      long_w: 20,
      atr_multiplier: 2.2,
      buffer_pct: 0.8,
    },
    code: `# ==========================================
# SmartQuant AI 智能优化策略: 双均线+ATR动态止损与成交量过滤
# 优化点: 1. 均线死区滤波 2. ATR动态跟踪止损 3. 5%刚性底线保护
# ==========================================

import numpy as np

def initialize(context):
    """策略初始化：设置初始资金、基准、参数与风控状态"""
    context.stock = "600519.SH"
    context.short_window = 5
    context.long_window = 20
    context.atr_window = 14
    context.atr_multiplier = 2.2  # 2.2 倍 ATR 移动跟踪止损
    context.buffer_ratio = 1.008   # 0.8% 均线死区缓冲，过滤微小毛刺
    
    # 运行时风控状态记录
    context.entry_price = 0.0
    context.highest_price = 0.0
    context.in_position = False

def handle_data(context, data):
    """每个 Bar/Tick 触发的交易逻辑"""
    # 获取历史收盘价与成交量数据
    hist = data.history(context.stock, ['open', 'high', 'low', 'close', 'volume'], 40)
    if len(hist) < 30:
        return
        
    closes = hist['close'].values
    highs = hist['high'].values
    lows = hist['low'].values
    volumes = hist['volume'].values
    current_price = closes[-1]
    
    # 1. 计算短期与长期均线
    ma_short = closes[-context.short_window:].mean()
    ma_long = closes[-context.long_window:].mean()
    
    # 2. 计算 ATR (真实波动幅度)
    tr_list = []
    for i in range(1, len(closes)):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        tr_list.append(tr)
    atr = np.mean(tr_list[-context.atr_window:]) if len(tr_list) >= context.atr_window else (highs[-1] - lows[-1])
    
    # 3. 计算成交量均线 (放量确认)
    vol_ma20 = volumes[-20:].mean() if len(volumes) >= 20 else volumes[-1]
    vol_confirmed = volumes[-1] > vol_ma20 * 1.15
    
    # 4. 持仓状态风控：ATR 移动止损 / 止盈检查
    if context.in_position:
        if current_price > context.highest_price:
            context.highest_price = current_price
            
        # 动态止损线：从最高点回撤超过 N * ATR 时强制止损
        stop_price = context.highest_price - (context.atr_multiplier * atr)
        hard_stop_price = context.entry_price * 0.95  # 5% 刚性硬止损
        
        if current_price < stop_price or current_price < hard_stop_price:
            # 触发风控止损平仓
            order_target_percent(context.stock, 0.0)
            context.in_position = False
            context.highest_price = 0.0
            context.entry_price = 0.0
            return
            
        # 趋势死叉平仓
        if ma_short < ma_long:
            order_target_percent(context.stock, 0.0)
            context.in_position = False
            context.highest_price = 0.0
            context.entry_price = 0.0
            return

    # 5. 开仓逻辑：均线金叉 + 突破缓冲阈值 + 成交量放量确认
    if not context.in_position:
        gold_cross = (ma_short > ma_long * context.buffer_ratio)
        if gold_cross and vol_confirmed:
            order_target_percent(context.stock, 0.95)  # 预留 5% 资金应对摩擦
            context.in_position = True
            context.entry_price = current_price
            context.highest_price = current_price
`,
  },
  {
    id: 'strat-multi-factor',
    name: '多因子动量与估值轮动策略 v2.0',
    category: '多因子模型',
    description: '结合动量因子 (20日收益率) 与估值因子 (PE/PB 排名)，在成长与价值之间动态自适应加仓。',
    author: 'SmartQuant 团队',
    version: '2.0.0',
    stockSymbol: '688981.SH',
    parameters: {
      momentum_window: 20,
      vol_multiplier: 1.3,
    },
    code: `def initialize(context):
    """
    多因子动量与成交量共振策略
    """
    context.stock = "688981.SH"  # 中芯国际
    context.mom_window = 20
    context.vol_ratio = 1.3

def handle_data(context, data):
    """
    多因子打分与买卖触发
    """
    hist = data.history(context.stock, ['close', 'volume'], 30)
    if len(hist) < context.mom_window:
        return
        
    closes = hist['close'].values
    volumes = hist['volume'].values
    
    # 动量因子: 20日收益率
    mom_return = (closes[-1] - closes[-context.mom_window]) / closes[-context.mom_window]
    
    # 量能因子: 当前成交量相对20日均量放大
    vol_avg = volumes[-20:].mean()
    vol_surge = volumes[-1] > (vol_avg * context.vol_ratio)
    
    # 买入条件: 动量向上 (>3%) 且 放量突破
    if mom_return > 0.03 and vol_surge:
        order_target_percent(context.stock, 1.0)
    # 卖出条件: 动量走弱或负收益
    elif mom_return < -0.01:
        order_target_percent(context.stock, 0.0)
`,
  },
];
