
# Crowd Cloud (alpha)
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/martensms/crowd-cloud?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

The Internet the Internet deserves

## The Concept

This project is partly inspired by the PeerServer project, kudos to the project owners!

First of all, the Crowd Cloud project uses peer-to-peer tunneled Websockets.
That means there's nothing like a server, every client is a server and vice versa.

The Browser Application and Server Application are both developed with lycheeJS.


### Terminology

1. A discovery server (using NodeJS) has a handshake and discovery functionality.
Each project can be hosted at multiple discovery servers.
The discovery server also resolves the URLs, passes it to the different peers and
interacts with them.

2. A browser is the HTML5 offline application that parses, requests and downloads
the content from (multiple) peers to your offline storage on your computer.

3. A project is a static website that is served via the discovery server.
There's a website-boilerplate that shows how the *crowd://* urls are resolved.
Basically, each crowd website can include content from other servers (such as YouTube)
or via the crowd-URL-schema which resolves to websocket peers spread over the planet.

4. Each browser is also a peer. After downloading the files successfully, it will
function as a peer and serve the content to new peers requesting the content via websockets.


### Network Flow

1. Your Web Browser (Chrome, Firefox, IE, Opera) requests *http://discovery.lycheejs.org/mywebsite*
2. The Browser Application connects to the discovery server API, requesting the index.html file.
3. The discovery server requests already connected peers for *crowd://mywebsite/index.html*.
4. One peer has the file and responds to the discovery server with the content of its index.html file.
5. After getting the data from the peer, the discovery server serves the content back to the initial peer requesting the data.


### Network States

All requests are basically session-based broadcasts, that's why they are called sessioncasts.
Each API method call on one side can trigger an event on the other side of the network connection.

|    | Requesting Peer     | Discovery Server   | Responding Peer |
|----|---------------------|--------------------|-----------------|
| 1  | request index.html  |                    |                 |
| 2  | -                   | request index.html |                 |
| 3  |                     |                    | response        |
| 4  |                     | response event     |                 |
| 5  | response event      |                    |                 |
| 6  | parse crowd://      |                    |                 |
| 7  | (n) request x       |                    |                 |
| 8  |                     | request x          |                 |
| 9  |                     |                    | response x      |
| 10 |                     | response event     |                 |
| 11 | response event      |                    |                 |
| 12 | ready event         |                    |                 |
|----|---------------------|--------------------|-----------------|
|    | (is now responding) |                    |                 |


### Network Ports

The discovery server listens on the port 7000 per default, you
can change it easily by modifying the *--port* flag.

The discovery server also listens per default on port 80, but
only for serving the initial Browser Application. This part
can be done with any kind of webserver as long as it supports
serving static asset files.


## Getting Started

- Start the Discovery Server

```bash
git clone https://github.com/LazerUnicorns/crowd-cloud.git ./crowd-cloud;
cd crowd-cloud;

node ./server/init.js --host="localhost" --port="7000"
```

- Open the Browser Application and visit *http://localhost/browser/index.html*

Note that the Browser Application can be served by any type of webserver, the only
important part is that the discovery server's websocket server is reacting properly
to resolve the requests successfully.


## License

This project is licensed under the WTFPL (Do What The Fuck You Want To Public License):


DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
Version 2, December 2004

Copyright (C) 2014 Christoph Martens

Everyone is permitted to copy and distribute verbatim or modified
copies of this license document, and changing it is allowed as long
as the name is changed.

DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

0. You just DO WHAT THE FUCK YOU WANT TO.

