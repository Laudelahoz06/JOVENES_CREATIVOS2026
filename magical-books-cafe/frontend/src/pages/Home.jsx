import Hero from "../components/home/Hero";
import ExperienceCards from "../components/home/ExperienceCards";
import FeaturedProducts from "../components/home/FeaturedProducts";

function Home() {

    return (
        <div className="home-page">

            <Hero />

            <ExperienceCards />

            <FeaturedProducts />

        </div>
    );
}

export default Home;