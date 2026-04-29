import dynamic from "next/dynamic";
const Home = dynamic(() => import("../components/App"), { ssr: false });
export default Home;
