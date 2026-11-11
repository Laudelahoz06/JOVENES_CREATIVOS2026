import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProducts } from "../../services/products";

// Evento que usa AssistantWidget para abrirse desde otra parte de la app.
const OPEN_ASSISTANT_EVENT = "open-assistant";

const baseExperiences = [
    {
        icon: "☕",
        title: "Café",
        description:
            "Sabores que inspiran: espresso, filtrados y combinaciones de la casa.",
        image:
            "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
        to: "/catalogo"
    },
    {
        icon: "📚",
        title: "Libros",
        description:
            "Historias para descubrir, desde clásicos hasta novedades.",
        image:
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80",
        to: "/catalogo"
    },
    {
        icon: "✦",
        title: "Comunidad",
        description:
            "Conecta con otros lectores, artistas y creadores del barrio.",
        image:
            "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80",
        to: "/contacto"
    },
    {
        icon: "💻",
        title: "Coworking",
        description:
            "Un espacio para crear: wifi, enchufes y buen café sin apuros.",
        image:
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
        to: "/contacto"
    },
    {
        icon: "♫",
        title: "Música",
        description:
            "Acompaña cada momento con nuestra selección de sonidos.",
        image:
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"
    },
    {
        icon: "✧",
        title: "App Inteligente",
        description:
            "Pregunta, descubre y planifica tu visita con nuestra asistente IA.",
        image:
            "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&q=80",
        action: "assistant"
    },
    {
        icon: "☕",
        title: "Degustaciones",
        description:
            "Cata guiada de nuestras variedades de café junto al barista.",
        image:
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
        to: "/catalogo"
    },
    {
        icon: "📖",
        title: "Clubes literarios",
        description:
            "Lectura compartida y conversación mediada cada mes.",
        image:
            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80",
        to: "/contacto"
    },
    {
        icon: "🗓️",
        title: "Reservas de espacio",
        description:
            "Mesa, rincón o sala para tu grupo, con reserva previa.",
        image:
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        to: "/contacto"
    }
];

function ExperienceCards() {
    const [services, setServices] = useState([]);

    // Las experiencias de tipo servicio se cargan desde el catálogo:
    // cualquier servicio nuevo creado en el panel admin aparece aquí solo.
    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(async () => {
            try {
                const { products } = await getProducts({
                    type: "service",
                    limit: 6
                });

                if (!cancelled) setServices(products);

            } catch {
                if (!cancelled) setServices([]);
            }
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, []);

    const serviceExperiences = services.map((product) => ({
        icon: "✧",
        title: product.name,
        description: product.description,
        image: product.image || product.imageUrl || null,
        to: `/catalogo/${product._id}`
    }));

    const experiences = [...baseExperiences, ...serviceExperiences];

    const openAssistant = () => {
        window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT));
    };

    return (
        <section id="experiencias" className="experiences">

            <div className="section-heading">
                <span>DESCUBRE NUESTRO UNIVERSO</span>
                <h2>Mucho más que un café</h2>
                <p>
                    {experiences.length} experiencias, un solo lugar.
                </p>
            </div>

            <div className="experience-grid">

                {experiences.map((item) => {

                    const content = (
                        <>
                            <div className="experience-media">

                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src =
                                                "/ProductoNoDisponible.png";
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="experience-media-empty"
                                        aria-hidden="true"
                                    />
                                )}

                                <span className="experience-icon">
                                    {item.icon}
                                </span>

                            </div>

                            <div className="experience-body">

                                <h3>{item.title}</h3>

                                <p>{item.description}</p>

                                {(item.to || item.action) && (
                                    <span className="experience-cta">
                                        {item.action === "assistant"
                                            ? "Pregúntale →"
                                            : "Ver más →"}
                                    </span>
                                )}

                            </div>
                        </>
                    );

                    if (item.to) {
                        return (
                            <Link
                                to={item.to}
                                className="experience-card"
                                key={item.title}
                            >
                                {content}
                            </Link>
                        );
                    }

                    if (item.action === "assistant") {
                        return (
                            <button
                                type="button"
                                className="experience-card"
                                key={item.title}
                                onClick={openAssistant}
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <article
                            className="experience-card"
                            key={item.title}
                        >
                            {content}
                        </article>
                    );
                })}

            </div>

        </section>
    );
}

export default ExperienceCards;
