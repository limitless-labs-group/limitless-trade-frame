import {Token} from "@/types/tokens";
import {Market, MarketData} from "@/types/market";
import {Address, formatUnits, getContract, parseUnits} from "viem";
import {defaultChain, newSubgraphURI} from "@/queries/constants";
import {getViemClient} from "@/contracts/utils";
import {fixedProductMarketMakerABI} from "@/contracts/abi/fixedProductMarketMakerABI";
import axios from "axios";

export const getLiquidityAndVolume = async (marketAddress: string, collateralToken: Token) => {
    const queryName = 'AutomatedMarketMaker'
    const res = await axios.request({
        url: newSubgraphURI[defaultChain.id],
        method: 'post',
        data: {
            query: `
            query ${queryName} {
              ${queryName} (
                where: {
                  id: {
                    _ilike: "${marketAddress}"
                  }
                }
              ) {
                funding
                totalVolume
              }
            }
          `,
        },
    })

    const [_marketData] = res.data.data?.[queryName] as MarketData[]
    const liquidity = formatUnits(BigInt(_marketData.funding), collateralToken?.decimals || 18)
    const volume = formatUnits(
        BigInt(_marketData.totalVolume ?? '0'),
        collateralToken?.decimals || 18
    )

    return {
        liquidity,
        volume,
    }
}

export const getOutcomeTokensPercent = async (market: Market, collateralToken: Token) => {
    const fixedProductMarketMakerContract = getContract({
        address: market.address[defaultChain.id] as Address,
        abi: fixedProductMarketMakerABI,
        client: getViemClient(),
    })
    if (!fixedProductMarketMakerContract || !collateralToken) {
        return ['0', '0']
    }

    const collateralDecimals = collateralToken?.decimals ?? 18
    const collateralAmount = collateralDecimals <= 6 ? `0.0001` : `0.0000001`
    const collateralAmountBI = parseUnits(collateralAmount, collateralDecimals)
    const outcomeTokenAmountYesBI = (await fixedProductMarketMakerContract.read.calcBuyAmount([
        collateralAmountBI,
        0,
    ])) as bigint
    const outcomeTokenAmountNoBI = (await fixedProductMarketMakerContract.read.calcBuyAmount([
        collateralAmountBI,
        1,
    ])) as bigint
    const outcomeTokenAmountYes = formatUnits(outcomeTokenAmountYesBI, collateralDecimals)
    const outcomeTokenAmountNo = formatUnits(outcomeTokenAmountNoBI, collateralDecimals)
    const outcomeTokenPriceYes = Number(collateralAmount) / Number(outcomeTokenAmountYes)
    const outcomeTokenPriceNo = Number(collateralAmount) / Number(outcomeTokenAmountNo)

    const sum = outcomeTokenPriceYes + outcomeTokenPriceNo
    const outcomeTokensPercentYes = ((outcomeTokenPriceYes / sum) * 100).toFixed(2)
    const outcomeTokensPercentNo = ((outcomeTokenPriceNo / sum) * 100).toFixed(2)

    return [outcomeTokensPercentYes, outcomeTokensPercentNo]
}