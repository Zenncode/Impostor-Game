import type { ReactNode } from "react";
import Navbar from "../components/layout/Navbar";

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps): React.JSX.Element => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default MainLayout;
