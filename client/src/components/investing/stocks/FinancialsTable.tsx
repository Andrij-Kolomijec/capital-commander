import { useQuery } from "@tanstack/react-query";
import classes from "./FinancialsTable.module.css";
import Loader from "../../common/Loader";
import { getStockData, getTickers } from "../../../utils/http/investing";
import { TickerProps } from "./SearchTicker";
import CalculatedFinancials from "./CalculatedFinancials";
import FinancialsRow from "./FinancialsRow";

export type FinancialsProps = Record<string, string | number>;

export default function FinancialsTable({ stock }: { stock: string }) {
  const {
    data: tickers,
    error: tickersError,
    isError: tickersIsError,
  } = useQuery({
    queryKey: ["tickers"],
    queryFn: getTickers,
    staleTime: 1000 * 60 * 60 * 24 * 2,
    placeholderData: [],
  });

  const { data, isFetching, isFetched, error, isError } = useQuery({
    queryKey: ["stocks", stock],
    queryFn: () => getStockData(stock),
    gcTime: 1000 * 60 * 60 * 2,
    staleTime: 1000 * 60 * 60 * 2,
    placeholderData: [],
  });

  if (isFetching && !isFetched) {
    return <Loader />;
  }

  if (tickersIsError) {
    return <p>{(tickersError as Error).message}</p>;
  }

  if (isError) {
    return <p>{(error as Error).message}</p>;
  }

  const tickerInfo = tickers.filter(
    (ticker: TickerProps) => ticker.symbol === stock.replace(".", "/")
  )[0];

  const financials: FinancialsProps = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== "ROE")
  ) as FinancialsProps;

  financials["Goodwill / Total Equity"] =
    Math.round(
      ((+(financials["Goodwill"] as string).replace(",", "") || 0) /
        +(financials["Total Stockholders Equity"] as string).replace(",", "")) *
        100
    ) / 100;

  financials["ROIC > WACC"] = `${financials["ROIC %"]} ${
    +financials["ROIC %"] > +financials["WACC %"] ? ">" : "<"
  } ${financials["WACC %"]}`;

  return (
    <>
      <table className={classes.table}>
        <tbody>
          <tr>
            <td>Company</td>
            <td>{tickerInfo.name}</td>
          </tr>
          <tr>
            <td>Symbol</td>
            <td>{tickerInfo.symbol}</td>
          </tr>
          {tickerInfo.sector && (
            <tr>
              <td>Sector</td>
              <td>{tickerInfo.sector}</td>
            </tr>
          )}
          {tickerInfo.industry && (
            <tr>
              <td>Industry</td>
              <td>{tickerInfo.industry}</td>
            </tr>
          )}
          <tr>
            <td>Country</td>
            <td>{tickerInfo.country}</td>
          </tr>
          {tickerInfo.ipoyear && (
            <tr>
              <td>IPO year</td>
              <td>{tickerInfo.ipoyear}</td>
            </tr>
          )}
          <tr>
            <td>Market capitalization</td>
            <td
              style={{
                color: +tickerInfo.marketCap > 500000000 ? "green" : "red",
              }}
            >
              {(+tickerInfo.marketCap).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              })}
            </td>
          </tr>
          <tr>
            <td>Stock price</td>
            <td
              style={{
                color:
                  +tickerInfo.lastsale.replace("$", "") >= 30 ? "green" : "red",
              }}
            >
              {tickerInfo.lastsale}
            </td>
          </tr>
          {Object.keys(financials)
            .filter(
              (key) =>
                key !== "WACC %" && key !== "ROIC %" && key !== "Goodwill"
            )
            .map((key) => {
              return (
                <tr key={key}>
                  <FinancialsRow name={key} item={financials[key]} />
                </tr>
              );
            })}
        </tbody>
      </table>
      <CalculatedFinancials
        price={tickerInfo.lastsale}
        totalStockholdersEquity={financials["Total Stockholders Equity"]}
        sharesOutstanding={financials["Shares Outstanding (Diluted Average)"]}
        PEMedian={financials["PE Ratio (10y Median)"]}
        ROEMedian={financials["ROE (10y Median)"]}
        dividendPayoutRatio={financials["Dividend Payout Ratio"]}
      />
    </>
  );
}
