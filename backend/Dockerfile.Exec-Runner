FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl wget git build-essential unzip zip software-properties-common \
    manpages-dev \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    openjdk-17-jdk \
    ruby-full \
    php-cli \
    perl \
    lua5.3 \
    golang-go \
    r-base \
    ghc \
    elixir \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    chmod -R a+w $RUSTUP_HOME $CARGO_HOME
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y dotnet-sdk-8.0

RUN node -v && python3 --version && java -version && go version && cargo --version && \
    php -v && ruby -v && perl -v && lua -v && R --version && ghc --version && \
    dotnet --version