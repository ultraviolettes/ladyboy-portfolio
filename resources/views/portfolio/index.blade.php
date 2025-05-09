<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ladyboy Studio</title>
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
            background: #000;
            color: #fff;
            font-family: 'Unbounded', sans-serif;
            height: 100%;
            overflow-x: hidden;
        }
        .frame {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            pointer-events: none;
            z-index: 10;
            font-size: 0.875rem;
        }
        .content {
            display: flex;
            justify-content: center;
            gap: 4vw;
            padding: 10vh 5vw 20vh;
        }
        .column {
            flex: 1;
            min-width: 300px;
        }
        .column__item {
            margin-bottom: 20vh;
        }
        .column__item-img {
            width: 100%;
            display: block;
            border-radius: 10px;
        }
    </style>
</head>
<body>
<div class="frame">
    <div>Ladyboy Studio</div>
    <div>Portfolio créatif</div>
</div>

<main>
    <div class="content">
        @foreach ($projects->chunk(ceil($projects->count() / 3)) as $projectChunk) <!-- Divise les projets en 3 colonnes -->
            <div class="column" data-scroll data-scroll-speed="{{ $loop->odd ? '1' : '-3' }}">
                @foreach ($projectChunk as $project)
                    <div class="column__item">
                        <img class="column__item-img" src="{{ $project->getFirstMediaUrl() }}" alt="{{ $project->title }}">
                    </div>
                @endforeach
            </div>
        @endforeach
    </div>
</main>

<script src="https://unpkg.com/locomotive-scroll/dist/locomotive-scroll.min.js"></script>
<script>
    const scroll = new LocomotiveScroll({
        el: document.querySelector('main'),
        smooth: true
    });
</script>
</body>
</html>
