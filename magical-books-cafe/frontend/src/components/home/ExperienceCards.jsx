const experiences = [
    {
        icon: "☕",
        title: "Café",
        description: "Sabores que inspiran."
    },
    {
        icon: "📚",
        title: "Libros",
        description: "Historias para descubrir."
    },
    {
        icon: "✦",
        title: "Comunidad",
        description: "Conecta con otros lectores."
    },
    {
        icon: "💻",
        title: "Coworking",
        description: "Un espacio para crear."
    },
    {
        icon: "♫",
        title: "Música",
        description: "Acompaña cada momento."
    },
    {
        icon: "✧",
        title: "App Inteligente",
        description: "Descubre nuevas experiencias."
    }
];

function ExperienceCards() {

    return (
        <section id="experiencias" className="experiences">

            <div className="section-heading">
                <span>DESCUBRE NUESTRO UNIVERSO</span>
                <h2>Mucho más que un café</h2>
                <p>Seis experiencias, un solo lugar.</p>
            </div>

            <div className="experience-grid">

                {experiences.map((item) => (

                    <article className="experience-card" key={item.title}>

                        <span className="experience-icon">
                            {item.icon}
                        </span>

                        <h3>{item.title}</h3>

                        <p>{item.description}</p>

                    </article>

                ))}

            </div>

        </section>
    );
}

export default ExperienceCards;