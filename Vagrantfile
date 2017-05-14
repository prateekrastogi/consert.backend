Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"

  #Docker installation
  config.vm.provision :shell, :inline  => "sudo rm -rf /var/lib/apt/lists/*"
  config.vm.provision :shell, :inline  => "sudo apt-get update"
  config.vm.provision :shell, :inline  =>  "sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D"
  config.vm.provision :shell, :inline  => "sudo apt-get install -y python-software-properties"
  config.vm.provision :shell, :inline  =>  "sudo apt-add-repository 'deb http://apt.dockerproject.org/repo ubuntu-trusty main'"
  config.vm.provision :shell, :inline  =>  "sudo apt-get update"
  config.vm.provision :shell, :inline  =>  "apt-cache policy docker-engine"
  config.vm.provision :shell, :inline  =>  "sudo apt-get install -y docker-engine"
  config.vm.provision :shell, :inline  =>  "sudo docker run hello-world"
  config.vm.provision :shell, :inline  =>  "sudo usermod -aG docker $(whoami)"

  config.vm.provision :shell, :inline  =>  "sudo apt-get install -y virtualbox "

  #minikube installation
  config.vm.provision :shell, :inline  => "curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && chmod +x minikube && sudo mv minikube /usr/local/bin/"
end
