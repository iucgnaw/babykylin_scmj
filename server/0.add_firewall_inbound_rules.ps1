New-NetFirewallRule -DisplayName "ChangHuaMahjong Account Server (TCP-In 9000)" -Direction Inbound -LocalPort 9000 -RemotePort Any -Protocol TCP -Enabled True
New-NetFirewallRule -DisplayName "ChangHuaMahjong Client (TCP-In 7456)" -Direction Inbound -LocalPort 7456 -RemotePort Any -Protocol TCP -Enabled True
New-NetFirewallRule -DisplayName "ChangHuaMahjong Client Service (TCP-In 9001)" -Direction Inbound -LocalPort 9001 -RemotePort Any -Protocol TCP -Enabled True
New-NetFirewallRule -DisplayName "ChangHuaMahjong Dealer API (TCP-In 12581)" -Direction Inbound -LocalPort 12851 -RemotePort Any -Protocol TCP -Enabled True
New-NetFirewallRule -DisplayName "ChangHuaMahjong Game Server (TCP-In 10000)" -Direction Inbound -LocalPort 10000 -RemotePort Any -Protocol TCP -Enabled True
New-NetFirewallRule -DisplayName "ChangHuaMahjong Game Server (TCP-In 9003)" -Direction Inbound -LocalPort 9003 -RemotePort Any -Protocol TCP -Enabled True
