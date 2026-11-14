import { useState } from "react";

import { sanitizeUrl } from "../../utils/url";

// Previsualiza la URL de imagen antes de guardarla: comprueba que el
// navegador pueda cargarla y avisa si el enlace no sirve. Usa la misma
// limpieza que se enviará al servidor, para que la vista previa coincida
// con lo que quedará guardado.
//
// El resultado se guarda asociado a la URL evaluada: si la URL cambia,
// el valor guardado deja de coincidir y el estado se resetea solo, sin
// necesidad de un efecto que limpie el estado.
function ImagePreview({ url }) {
    const [loaded, setLoaded] = useState(null);
    const [failed, setFailed] = useState(null);

    const clean = sanitizeUrl(url);

    if (!clean) return null;

    const ok = loaded === clean;
    const error = failed === clean;

    if (error) {
        return (
            <div className="admin-image-preview">
                <div className="admin-image-preview-fail">
                    <p className="admin-image-preview-text">
                        La imagen no se pudo cargar. Verifica que el enlace
                        apunte a un archivo de imagen (jpg, png, webp) y que
                        no esté protegido contra enlaces externos.
                    </p>

                    <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => setFailed(null)}
                    >
                        Probar de nuevo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-image-preview">
            <img
                src={clean}
                alt="Vista previa de la imagen"
                onLoad={() => setLoaded(clean)}
                onError={() => setFailed(clean)}
            />

            {ok ? (
                <p className="admin-image-preview-text admin-image-preview-ok">
                    La imagen se carga correctamente.
                </p>
            ) : (
                <p className="admin-image-preview-text">
                    Comprobando la imagen...
                </p>
            )}
        </div>
    );
}

export default ImagePreview;
