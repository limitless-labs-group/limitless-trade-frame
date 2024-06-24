import {Token} from "@/types/tokens";
import {Market, MarketData, TradeQuotes} from "@/types/market";
import {Address, formatUnits, getContract, parseUnits} from "viem";
import {defaultChain} from "@/queries/constants";
import {getViemClient} from "@/contracts/utils";
import {fixedProductMarketMakerABI} from "@/contracts/abi/fixedProductMarketMakerABI";

export const getQuote = async (market: Market, collateralAmount: string, collateralToken: Token, outcomeTokenId: number, outcomeTokensBuyPercent: number[]) => {
    const fixedProductMarketMakerContract = getContract({
        address: market.address[defaultChain.id] as Address,
        abi: fixedProductMarketMakerABI,
        client: getViemClient(),
    })
    if (!fixedProductMarketMakerContract || !(Number(collateralAmount) > 0)) {
        return null
    }

    const collateralAmountBI = parseUnits(collateralAmount ?? '0', collateralToken?.decimals || 18)

    let outcomeTokenAmountBI = BigInt(0)
    outcomeTokenAmountBI = (await fixedProductMarketMakerContract.read.calcBuyAmount([
        collateralAmountBI,
        outcomeTokenId,
    ])) as bigint

    if (outcomeTokenAmountBI == BigInt(0)) {
        return null
    }

    const outcomeTokenAmount = formatUnits(outcomeTokenAmountBI, collateralToken.decimals || 18)
    const outcomeTokenPrice = (Number(collateralAmount) / Number(outcomeTokenAmount)).toString()

    const roi = ((Number(outcomeTokenAmount) / Number(collateralAmount) - 1) * 100).toString()
    const priceImpact = Math.abs(Number(((outcomeTokensBuyPercent[outcomeTokenId] - 1))) / (Number(outcomeTokenPrice) * 100)).toString()

    const quotes: TradeQuotes = {
        outcomeTokenPrice,
        outcomeTokenAmount,
        roi,
        priceImpact,
    }

    return quotes
}