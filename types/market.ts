export type TradeQuotes = {
    outcomeTokenAmount: string // amount of outcome token to be traded based on collateral amount input or ctBalance
    outcomeTokenPrice: string // average cost per outcome token
    roi: string // return on investment aka profitability percentage
    priceImpact: string // price fluctuation percentage
}