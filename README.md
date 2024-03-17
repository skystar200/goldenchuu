서비스 및 CI/CD에 대한 자세한 상세 설명은 다음 참조 https://bit.ly/aws-1-1-final-project

## ✨ 대규모 글로벌 트래픽을 빠르고 안정적으로 처리하는 선예매 티켓팅 웹앱 서비스
## 🙋‍♂️01 | Request from Client
**선예매티켓팅 서비스**
```
K-pop에 대한 관심이 전세계적으로 뜨거워지면서, 팬들의 성원에 대한 보답으로 K-POP 선두주자인 대형기획사 클라이언트가 팬클럽 회원들만을 위한 선예매 서비스를 제공하고자 함

1️⃣ 대규모의 글로벌 트래픽이 발생할 것으로 예상되는만큼, 전 세계 어디에서 유저들이 접속하든 상관없이 최대한 빠른 속도로 서버의 서비스를 안정적으로 제공받을 수 있어야함
2️⃣ 티켓팅이 이루어지지 않는 시기에는 트래픽이 적어질 것을 예상하여, 유연하고 탄력적으로 반응할 수 있도록 설계되어야함
3️⃣ 웹사이트의 기능 업데이트 및 공연 정보 업로드 시, 서비스 중단 없이 즉각적으로 배포되어야 함

위의 **세가지 조건을 충족하는 솔루션을 클라이언트에게 전달해야함**
```

## 🚩02 | 3 Key Points
### 1️⃣ Global Accelerator을 이용한 글로벌 유저에게 안정적인 속도 제공
AWS의 Global Accelerator 는 TCP와 UDP의 응답 속도를 개선하는 서비스로 앱의 네트워크 성능을 최대 60%까지 향상할 수 있으며 Multi-region 및 Multi-AZ 아키텍처를 위한 빠른 장애 조치로 높은 가용성을 제공함

➕ Edge Location을 활용하여 가장 가까운 지역의 endpoint로 가는 최적의 경로를 찾는 기능을 가지고 있음

구축할 앱은 서울 리전에 단일 서버를 가지고 있고 이미지나 비디오와 같은 콘텐츠를 제공하는 것 보다는 전세계의 유정들이 해당 단일 서버에 빠르게 접근할 수 있도록 조치를 취하고 싶기 때문에, CDN의 역할을 하는 CloudFront 보다 최적의 경로를 찾아주는 Global Accelerator을 사용하자는 결론에 도달

### 2️⃣ EKS+HPA를 통해 탄력성 확보
AWS의 Managed Kubernetes Service인 EKS를 활용하여 컨테이너를 관리하고, HPA (Horizontal Pod Autoscaling)을 통해 Pod에 주어진 리소스의 임계점을 초과했을 때 자동으로 scale-out, scale-in이 진행되어 트래픽에 맞춘 유연성과 탄력성이 확보 될 수 있도록 구현
![Untitled (5)](https://github.com/skystar200/star-universe-circle/assets/80840476/1a27e181-306c-4148-9316-524d2c53e4f9)


argoCD에서도 확인 가능한 scale-out으로 생성된 Pod

### 3️⃣ CI/CD 파이프라인을 통한 앱 릴리스와 배포 자동화
[CI] Github Action을 활용해서 현재 wy-app:source code repository에서 commit이 있으면 자동으로 ECR로 docker build+push가 되며, wy-dep:manifest repository에 있는 deployment.yml 파일에서 이미지 태그 업데이트

[CD] argoCD로 wy-dep을 모니터링하다가 변경사항이 생기면 EKS 클러스터에 deploy해서 변경사항 적용된 서비스 제공

Github Action

Github 저장소를 기반으로 소프트웨어 개발 Worflow를 자동화 할 수 있는 도구로, Github 저장소에서 발생하는 build, test, package, release, deploy 등 다양한 이벤트를 활용하여 원하는 workflow를 생성할 수 있음

➡️ Github Action에서 제공하는 Fully managed service로 이를 실행하기 위해 따로 인프라를 확장하거나 운영하는 방법을 고려하지 않아도 되는 장점이 있고, Github 저장소를 포크하면 자동으로 Action도 포크되기 때문에 Github로 프로젝트 관리를 하고 있기에 더 간단한 CI/CD 파이프라인 툴이라 판단되어 사용해보기로 결론

CI/CD는 무중단 배포랑은 다른 개념입니다
## 👣 03 | Architecture
### Service Architecture
![309661316-5eadb1fe-ab6c-4f57-91df-e921287b5555](https://github.com/skystar200/star-universe-circle/assets/80840476/421ebb4a-2089-46f1-a5d4-6dafcdc1a192)

### CI/CD Pipeline
![CICD-pipeline (1)](https://github.com/skystar200/star-universe-circle/assets/80840476/559152a5-2499-436c-a4a6-63b226f1faaa)


