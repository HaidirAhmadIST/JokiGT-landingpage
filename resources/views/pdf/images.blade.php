<!DOCTYPE html>
<html>
<head>
    <title>Dokumen Lampiran</title>
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        .page-break {
            page-break-after: always;
        }
        .image-container {
            width: 100%;
            height: 100%;
            text-align: center;
        }
        img {
            max-width: 100%;
            max-height: 100%;
            display: block;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    @foreach($images as $image)
        <div class="image-container">
            <img src="{{ $image }}">
        </div>
        @if(!$loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>
