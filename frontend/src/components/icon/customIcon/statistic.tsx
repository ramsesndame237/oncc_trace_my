import { cn } from "@/lib/utils";
import { type CustomIcon } from "../type";

export const StatisticIcon: CustomIcon = ({ className }) => (
  <svg
    viewBox="0 0 15 14"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("fill-none", className)}
  >
    <path
      d="M12.3305 2.11753C11.1756 0.825096 9.4707 0 7.60021 0C6.96741 0 6.36256 0.0827239 5.8125 0.247099L7.68294 6.35253L12.3305 2.11753Z"
      fill="currentColor"
    />
    <path
      d="M7.38041 7.72901L5.50997 1.70636C2.89717 2.47667 1 4.86923 1 7.72901C1 11.195 3.80505 14 7.271 14C10.737 14 13.542 11.195 13.542 7.72901H7.38041Z"
      fill="currentColor"
    />
    <path
      d="M8.09473 7.01339H13.5126C13.5126 5.61029 12.9905 4.31786 12.1095 3.35519L8.09473 7.01339Z"
      fill="currentColor"
    />
  </svg>
);
