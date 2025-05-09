<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ladyboy Studio - Welcome</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
      color: #fff;
      font-family: 'Unbounded', sans-serif;
      overflow: hidden;
    }
    .loader-container {
      text-align: center;
      animation: fadeIn 1.5s ease-out forwards;
    }
    .loader-title {
      font-size: 2rem;
      text-transform: uppercase;
      margin-bottom: 2rem;
    }
    .loader-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 2px solid #fff;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      cursor: pointer;
      transition: transform 0.3s ease, background-color 0.3s ease;
    }
    .loader-button:hover {
      background-color: #fff;
      color: #000;
    }
    .loader-button svg {
      width: 20px;
      height: 20px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="loader-container">
    <div class="loader-title">Bienvenue chez Ladyboy Studio</div>
    <button class="loader-button" id="enter-button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
      </svg>
    </button>
  </div>

  <script>
    const button = document.getElementById('enter-button');

    // Gère le clic sur le bouton
    button.addEventListener('click', () => {
      // Redirection vers la page des projets
      window.location.href = "{{ route('portfolio') }}";
    });
  </script>
</body>
</html>
