export enum MarketTokensIds {
    DEGEN = 'degen-base',
    ETH = 'ethereum',
    WETH = 'ethereum',
    HIGHER = 'higher',
    MFER = 'mfercoin',
    ONCHAIN = 'onchain',
    REGEN = 'regen',
    USDC = 'usd-coin',
    VITA = 'vitadao',
}

export interface Token {
    address: string,
    symbol: string,
    decimals: number,
    name: string,
    logoUrl: string,
    priceOracleId: MarketTokensIds,
    id: MarketTokensIds
}