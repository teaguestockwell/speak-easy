[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

[license-shield]: https://img.shields.io/github/license/teaguestockwell/speak-easy.svg
[license-url]: https://github.com/teaguestockwell/speak-easy/blob/master/licence.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/teague-stockwell/

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/teaguestockwell/speak-easy">
    <img src="https://user-images.githubusercontent.com/71202372/183279390-33800f61-abbe-4bf7-b174-86fe7b553acc.png" alt="Logo" height="400">
  </a>

  <h3 align="center">Speak Easy</h3>

  <p align="center">
    An end to end encrypted peer to peer chat client
    <br />
    <a href="https://github.com/teaguestockwell/speak-easy">View Portfolio</a>
    ·
    <a href="https://github.com/teaguestockwell/speak-easy/issues">Report Bug</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project
A messaging client exercising asymmetric encryption from [window.crypto.subtle](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) and [peerjs](https://github.com/peers/peerjs)

when ou connect to another client, you share your RSA AES 256 public key so they can send you encrypted messages over webRTC, then using the private key you can decrypt the messages to plain text.

## Getting Started

To get a local copy up and running follow these simple steps.

1. Fork the repository
2. Clone the repository
3. Install dependencies

```sh
yarn
```

4. Run the dev server

```sh
yarn dev
```

5. Navigate to http://localhost:3006

## Roadmap

See the [open issues](https://github.com/teaguestockwell/speak-easy/issues) for a list of proposed features (and known issues).

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Teague Stockwell - [LinkedIn](https://www.linkedin.com/in/teague-stockwell)