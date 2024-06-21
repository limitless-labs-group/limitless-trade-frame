export interface MarketData {
    funding: string
    totalVolume: string
}

export type Market = {
    address: {
        [chainId: number]: string
    }
    questionId?: {
        [chainId: number]: string
    }
    conditionId: {
        [chainId: number]: string
    }
    collateralToken: {
        [chainId: number]: string
    }
    hidden: {
        [chainId: number]: boolean
    }
    resolved: {
        [chainId: number]: boolean
    }
    outcomeTokens: string[]
    title: string
    description: string
    placeholderURI: string
    imageURI: string
    ogImageURI?: string
    expirationDate: string
    expirationTimestamp: number
    createdAt: number
    expired?: boolean
    tokenTicker: {
        [chainId: number]: string
    }
    tokenURI: {
        [chainId: number]: string
    }
    creator: {
        name: string
        imageURI?: string
        link?: string
    }
    tags?: string[]
    winningOutcomeIndex?: number
    volume?: string
    liquidity?: string
}

export type TradeQuotes = {
    outcomeTokenAmount: string // amount of outcome token to be traded based on collateral amount input or ctBalance
    outcomeTokenPrice: string // average cost per outcome token
    roi: string // return on investment aka profitability percentage
    priceImpact: string // price fluctuation percentage
}