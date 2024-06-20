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