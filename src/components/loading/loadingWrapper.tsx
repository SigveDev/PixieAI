import { ReactNode } from "react";

const LoadingWrapper = ({ children }: { children: ReactNode }) => {
  return <div className="animate-pulse">{children}</div>;
};

export default LoadingWrapper;
