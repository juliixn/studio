{ pkgs, ... }:

{
  packages = [
    pkgs.nodejs_20
    pkgs.openssl
    pkgs.prisma
  ];

  enterShell = ''
    npm install
  '';
}
