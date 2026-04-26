import dynamic from "next/dynamic";
const Home = dynamic(() => import("./index_app"), { ssr: false });
export default Home;
