import { animate, createAnimatable, eases, utils } from 'animejs';
import.meta.glob([
  '../img/**',
  '../fonts/**',
]);

// [1] Encapsulation dans une fonction principale
const App = (() => {
    // [2] Sélection des éléments DOM avec vérification d'existence
    const DOM = {
        intro: document.querySelector(".loader-container"),
        shape: document.querySelector("svg.shape"),
        enter: document.querySelector(".fleche"),
        imageContainer: document.querySelector(".img-container"),
        path: null,
    };

    if (DOM.shape) {
        DOM.path = DOM.shape.querySelector("path");
    }

    /**
     * [3] Fonction pour naviguer avec animation Anime.js
     */
    const navigate = () => {

        if (DOM.intro && DOM.shape && DOM.path) {
            DOM.intro.style.overflow = "visible";
            DOM.shape.style.fill = "#ffb4ec";

            animate(DOM.intro, {
                duration: 1600,
                ease: eases.inOutBack,
                y: -200,
                onComplete: self => DOM.intro.style.display = "none",
            });

            animate(DOM.shape, {
                ease: eases.inOutCubic,
                scaleY: [
                    { value: [0, 1], duration: 800 },
                    {
                        value: 0,
                        duration: 1200,
                        ease: eases.outElastic,
                        elasticity: 700,
                    },
                ],
            });

            animate(DOM.path, {
                duration: 800,
                ease: eases.inOutQuad,
                d: DOM.path.getAttribute("pathdata:id"),
            });

            animate([DOM.enter, DOM.shape], {
                duration: 1300,
                ease: eases.linear(),
                backgroundColor: (t, i) => i === 0 ? "#000" : null,
                fill: (t, i) => i === 1 ? "#ffb4ec" : null,
                // complete: () => "background-color: #000; fill: #ffb4ec;", //window.location.href = "/portfolio"
            });
        } else {
            console.warn("DOM elements required for navigation are missing.");
        }
    };

    /**
     * [4] Fonction pour déplacer les yeux en fonction de la souris
     */
     const moveEyes = () => {
        const eye = document.querySelector(".eye-outer");
        const boundingBox = document.querySelector(".bounding-box");

        if (eye) {
            // Définir les limites de mouvement des yeux
            let bounds = boundingBox.getBoundingClientRect();
            const refreshBounds = () => (bounds = boundingBox.getBoundingClientRect());

            // Créer un objet animatable pour gérer les transformations (position de l'œil)
            const animatableEye = createAnimatable(eye, {
                x: 500, // Durée pour animer sur X (en ms)
                y: 500, // Durée pour animer sur Y (en ms)
                ease: 'out(3)', // Courbe de sortie
            });

            // Définir la logique pour suivre le mouvement de la souris
            const onMouseMove = (e) => {
                // Dimensions de la bounding-box
                const { left, top, width, height } = bounds;

                // Calcul de la position relative de la souris dans les limites
                const minX = 0; // Limite à gauche
                const maxX = width; // Limite à droite
                const minY = 0; // Limite en haut
                const maxY = height; // Limite en bas

                // Position de la souris par rapport à la bounding-box
                const relativeX = e.clientX - left; // Position X relative à la box
                const relativeY = e.clientY - top; // Position Y relative à la box

                // Contraindre les mouvements de l'œil à l'intérieur de la bounding-box
                const x = utils.clamp(relativeX, minX, maxX) - (width / 2); // Centrer par rapport à l'œil
                const y = utils.clamp(relativeY, minY, maxY) - (height / 2);

                // Mise à jour des valeurs X et Y animées
                animatableEye.x(x); // Anime l'axe X de l'œil
                animatableEye.y(y); // Anime l'axe Y de l'œil
            };

            // Écouteur de mouvement pour la souris
            window.addEventListener('mousemove', onMouseMove);

            // Rafraîchir les limites si la fenêtre est redimensionnée
            window.addEventListener('resize', refreshBounds);
        }
    };



    /**
     * [5] Initialisation des événements
     */
    const init = () => {
        if (DOM.enter) {
            DOM.enter.addEventListener("click", navigate);
            DOM.enter.addEventListener("touchenter", navigate);
        } else {
            console.warn("No navigation trigger element found.");
        }

        moveEyes(); // Initialise l'animation des yeux
    };

    // [6] Lancer tout lorsque la page est chargée
    window.addEventListener("load", init);

    return {
        init,
    };
})();

export default App;
