import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";

import { getProducts } from "../../services/products";
import { getExperiences } from "../../services/experiences";

// Evento que usa AssistantWidget para abrirse desde otra parte de la app.
const OPEN_ASSISTANT_EVENT = "open-assistant";

// Respaldo si la API está vacía o no responde: mantiene el home siempre completo.
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
    const [managed, setManaged] = useState([]);
    const [spotifyOpen, setSpotifyOpen] = useState(null);
    const [whatsappOpen, setWhatsappOpen] = useState(null);
    const [qrImage, setQrImage] = useState("");

    // Abre el modal de WhatsApp y genera el QR del enlace del grupo.
    const openWhatsapp = async (item) => {
        setWhatsappOpen(item);
        setQrImage("");

        try {
            const url = await QRCode.toDataURL(item.whatsappUrl, {
                width: 320,
                margin: 2,
                color: {
                    dark: "#171321",
                    light: "#F4EBDD"
                }
            });

            setQrImage(url);
        } catch {
            setQrImage("");
        }
    };

    // Convierte la URL de Spotify en su embed incrustable.
    // Soporta playlist, album, artista, track, episodio y programas,
    // rutas con /intl-xx/ y enlaces con query (?si=...).
    const toSpotifyEmbed = (url) => {
        if (!url) return "";

        try {
            const parsed = new URL(url);

            // Los enlaces cortos spotify.link no se pueden incrustar.
            if (parsed.hostname === "spotify.link") return "";

            const parts = parsed.pathname
                .split("/")
                .filter(Boolean)
                // Quita el segmento regional (intl-es, intl-en, ...).
                .filter((segment) => !segment.startsWith("intl-"));

            const [type, id] = parts;
            const tipos = [
                "playlist",
                "album",
                "artist",
                "track",
                "episode",
                "show"
            ];

            if (type && id && tipos.includes(type)) {
                return `https://open.spotify.com/embed/${type}/${id}`;
            }

            return `https://open.spotify.com/embed${parsed.pathname}`;
        } catch {
            return "";
        }
    };

    // Experiencias administradas desde el panel admin (GET /experiences).
    // Si la API falla o no hay registros, se usa el respaldo hardcodeado.
    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(async () => {
            try {
                const { experiences } = await getExperiences({
                    limit: 50
                });

                if (!cancelled) setManaged(experiences);
            } catch {
                if (!cancelled) setManaged([]);
            }
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, []);

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

    const managedExperiences = managed.map((item) => ({
        icon: item.icon || "✦",
        title: item.title,
        description: item.description,
        image: item.image || null,
        to: item.to || undefined,
        action: item.action || undefined,
        spotifyUrl: item.spotifyUrl || undefined,
        whatsappUrl: item.whatsappUrl || undefined
    }));

    const serviceExperiences = services.map((product) => ({
        icon: "✧",
        title: product.name,
        description: product.description,
        image: product.image || product.imageUrl || null,
        to: `/catalogo/${product._id}`
    }));

    const base = managedExperiences.length > 0
        ? managedExperiences
        : baseExperiences;

    const experiences = [...base, ...serviceExperiences];

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

                                {(item.to ||
                                    item.action ||
                                    item.spotifyUrl ||
                                    item.whatsappUrl) && (
                                    <span className="experience-cta">
                                        {item.whatsappUrl
                                            ? "Unirse →"
                                            : item.action === "assistant"
                                              ? "Pregúntale →"
                                              : item.spotifyUrl
                                                ? "Escuchar →"
                                                : "Ver más →"}
                                    </span>
                                )}

                            </div>
                        </>
                    );

                    if (item.whatsappUrl) {
                        return (
                            <button
                                type="button"
                                className="experience-card"
                                key={item.title}
                                onClick={() => openWhatsapp(item)}
                            >
                                {content}
                            </button>
                        );
                    }

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

                    if (item.spotifyUrl) {
                        return (
                            <button
                                type="button"
                                className="experience-card"
                                key={item.title}
                                onClick={() => setSpotifyOpen(item)}
                            >
                                {content}
                            </button>
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

            {/* Modal con el QR del grupo de WhatsApp */}
            {whatsappOpen && (
                <div
                    className="spotify-modal-overlay"
                    onClick={() => setWhatsappOpen(null)}
                    role="presentation"
                >
                    <div
                        className="spotify-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`URL de conexión de ${whatsappOpen.title}`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="spotify-modal-header">
                            <h3>
                                {whatsappOpen.icon} {whatsappOpen.title}
                            </h3>
                            <button
                                type="button"
                                className="admin-link-button"
                                aria-label="Cerrar"
                                onClick={() => setWhatsappOpen(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="spotify-modal-description">
                            {whatsappOpen.description}
                        </p>

                        <div className="whatsapp-qr-box">
                            {qrImage ? (
                                <img
                                    className="whatsapp-qr-img"
                                    src={qrImage}
                                    alt={`Código QR del grupo de ${whatsappOpen.title}`}
                                />
                            ) : (
                                <p className="admin-status">
                                    Generando código QR...
                                </p>
                            )}
                        </div>

                        <div className="spotify-modal-actions">
                            <a
                                className="btn-primary"
                                href={whatsappOpen.whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Unirse al grupo 💬
                            </a>

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setWhatsappOpen(null)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <p className="spotify-modal-hint">
                            Escanea el código QR con tu celular o toca
                            «Unirse» para abrir el enlace de la comunidad.
                        </p>
                    </div>
                </div>
            )}

            {/* Modal con la playlist de Spotify */}
            {spotifyOpen && (
                <div
                    className="spotify-modal-overlay"
                    onClick={() => setSpotifyOpen(null)}
                    role="presentation"
                >
                    <div
                        className="spotify-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Playlist de ${spotifyOpen.title}`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="spotify-modal-header">
                            <h3>
                                {spotifyOpen.icon} {spotifyOpen.title}
                            </h3>
                            <button
                                type="button"
                                className="admin-link-button"
                                aria-label="Cerrar"
                                onClick={() => setSpotifyOpen(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="spotify-modal-description">
                            {spotifyOpen.description}
                        </p>

                        {toSpotifyEmbed(spotifyOpen.spotifyUrl) ? (
                            <iframe
                                className="spotify-embed"
                                src={toSpotifyEmbed(spotifyOpen.spotifyUrl)}
                                width="100%"
                                height="420"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                title={`Playlist de ${spotifyOpen.title}`}
                            />
                        ) : (
                            <div className="whatsapp-qr-box">
                                <p className="admin-status">
                                    Este enlace no se puede mostrar aquí.
                                    Ábrelo en Spotify para ver la lista.
                                </p>
                            </div>
                        )}

                        <div className="spotify-modal-actions">
                            <a
                                className="btn-primary"
                                href={spotifyOpen.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Abrir en Spotify ♪
                            </a>

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setSpotifyOpen(null)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <p className="spotify-modal-hint">
                            Usa una URL de playlist de Spotify
                            (open.spotify.com/playlist/...) para que aquí se
                            muestren las canciones de la lista.
                        </p>
                    </div>
                </div>
            )}

        </section>
    );
}

export default ExperienceCards;
