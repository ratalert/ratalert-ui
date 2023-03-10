# Deploy vars
ENV                 ?= test
SERVICE_NAME        ?= ratalert
DOMAIN_NAME         ?= ratalert.com
FULL_DOMAIN_NAME    ?= $(if $(ENV:prod=),$(ENV).,)${DOMAIN_NAME}
BLOCKCHAIN_ENV      ?= $(if $(ENV:prod=),rinkeby,)
AWS_REGION          ?= us-east-1
ACCOUNT_ID          ?= 450436298120
CLOUDFRONT_KEYPAIR  ?= APKAIR65YTALAY22Z27Q
ACM_CERTIFICATE_ARN ?= arn:aws:acm:us-east-1:786343530383:certificate/61c85a0c-73e8-4294-9aec-da7ef557e43a
CF_BUCKET           ?= cf-templates-${SERVICE_NAME}-${AWS_REGION}
CFN_TAGS = --tags environment=${ENV}

export AWS_PROFILE=${SERVICE_NAME}


deploy-matic:
	@$(eval TAG := latest)
#	yarn install --prod
	REACT_APP_GRAPH_ETH_ENV=${BLOCKCHAIN_ENV} yarn buildMatic
	aws s3 sync ./build/ s3://${FULL_DOMAIN_NAME}/ --delete
	make clear-cache ENV=main

deploy-mumbai:
	@$(eval TAG := latest)
#	yarn install --prod
	REACT_APP_GRAPH_ETH_ENV=${BLOCKCHAIN_ENV} yarn buildMumbai
	aws s3 sync ./build/ s3://${FULL_DOMAIN_NAME}/ --delete

deploy-app:
	@$(eval TAG := latest)
#	REACT_APP_GRAPH_URI=//api.thegraph.com/subgraphs/name/george-prime/ratalert-dao npm run buildMainTest2
#	REACT_APP_GRAPH_ETH_ENV=${BLOCKCHAIN_ENV} yarn build
	aws s3 sync ./build/ s3://${FULL_DOMAIN_NAME}/ --delete

deploy-landing:
	@$(eval TAG := latest)
	#yarn install --prod
	REACT_APP_MODE=full REACT_APP_API_URL=https://api.ratalert.com REACT_APP_GRAPH_ETH_ENV=${BLOCKCHAIN_ENV} yarn buildMatic


	aws s3 sync ./build/ s3://ratalert.com/ --delete
	sed 's/\<\/title\>/<\/title><meta name="twitter:card" content="summary_large_image"\/><meta name="twitter:site" content="@RatAlertNFT"\/><meta name="twitter:title" content="RatAlert 1000 NFT Giveaway"\/><meta name="twitter:image" content="https:\/\/user-assets.out.sh\/user-assets\/1995673\/F9KXLi61HQazxqyz\/ratalert_1000_nfts_2.png"\/>/g' build/index.html >build/giveaway
	aws s3 cp --content-type "text/html" --metadata-directive REPLACE build/giveaway s3://ratalert.com/giveaway

	sed 's/\<\/title\>/<\/title><meta name="twitter:card" content="summary_large_image"\/><meta name="twitter:site" content="@RatAlertNFT"\/><meta name="twitter:title" content="RatAlert 1000 NFT Giveaway"\/><meta name="twitter:image" content="https:\/\/user-assets.out.sh\/user-assets\/1995673\/F9KXLi61HQazxqyz\/ratalert_1000_nfts_2.png"\/>/g' build/index.html >build/herrcooles
	aws s3 cp --content-type "text/html" --metadata-directive REPLACE build/herrcooles s3://ratalert.com/herrcooles

	sed 's/\<\/title\>/<\/title><meta name="twitter:card" content="summary_large_image"\/><meta name="twitter:site" content="@RatAlertNFT"\/><meta name="twitter:title" content="RatAlert 1000 NFT Giveaway"\/><meta name="twitter:image" content="https:\/\/user-assets.out.sh\/user-assets\/1995673\/F9KXLi61HQazxqyz\/ratalert_1000_nfts_2.png"\/>/g' build/index.html >build/ralph
	aws s3 cp --content-type "text/html" --metadata-directive REPLACE build/ralph s3://ratalert.com/ralph

	#aws s3 mv s3://ratalert.com/whitepaper/en.html s3://ratalert.com/whitepaper
	#aws s3 mv s3://ratalert.com/whitepaper/fr.html s3://ratalert.com/fr/whitepaper
	#aws s3 mv s3://ratalert.com/roadmap/en.html s3://ratalert.com/roadmap
	#aws s3 mv s3://ratalert.com/roadmap/fr.html s3://ratalert.com/fr/roadmap
	#aws s3 mv s3://ratalert.com/assets/images/infographic.png s3://ratalert.com/infographic
	make clear-cache ENV=prod

clear-cache:
	@DISTRIBUTION="E5H9VMU68O7UP" && [[ "${ENV}" == "prod" ]] && DISTRIBUTION=EIB41B6XCOCXM; \
	aws cloudfront create-invalidation --distribution-id $$DISTRIBUTION --paths "/*"

deploy-cf-bucket:
	@echo "+ Creating CloudFormation bucket"
	aws s3 mb s3://${CF_BUCKET} --region ${AWS_REGION}

deploy-skeleton:
	@echo "+ Deploying skeleton"; \
	aws cloudformation deploy \
		--stack-name "skeleton" \
		--template-file ops/stacks/skeleton-mini.json \
		--region ${AWS_REGION} \
		--s3-bucket ${CF_BUCKET} \
		--no-fail-on-empty-changeset \
		--parameter-overrides \
			ServiceName="global" \
		$(CFN_TAGS) service-name=${SERVICE_NAME}; \

deploy-ssl:
	@echo "+ Deploying SSL stack"; \
	aws cloudformation deploy \
		--stack-name "ssl" \
		--template-file ops/stacks/ssl.yaml \
		--region ${AWS_REGION} \
		--s3-bucket ${CF_BUCKET} \
		--no-fail-on-empty-changeset \
		--parameter-overrides \
			ServiceName="ssl" \
			DomainName="${DOMAIN_NAME}" \
		$(CFN_TAGS) service-name=${SERVICE_NAME}; \

deploy-cloudfront:
	@test ! -f ops/stacks/cloudfront/pk-${CLOUDFRONT_KEYPAIR}.pem && echo "ops/stacks/cloudfront/pk-${CLOUDFRONT_KEYPAIR}.pem does not exist!\nIn case you lost it, create a new one with the root account:\nhttps://console.aws.amazon.com/iam/home?region=us-east-1#/security_credentials" && exit; \
	echo "+ Deploying CloudFront stack in ${ENV} environment"; \
	export POLICY=$$(cat ops/stacks/cloudfront/policy.json | tr -d " \t\n\r" | sed s/_DOMAIN_/${FULL_DOMAIN_NAME}/); \
	CLOUDFRONT_POLICY=$$(echo $$POLICY | base64 | tr '+=/' '-_~'); \
	CLOUDFRONT_SIGNATURE=$$(echo $$POLICY | openssl sha1 -sign ops/stacks/cloudfront/pk-${CLOUDFRONT_KEYPAIR}.pem | base64 | tr '+=/' '-_~'); \
	PROTECTED="true" && [[ "${ENV}" == "prod" || "${ENV}" == "main" || "${ENV}" == "beta" || "${ENV}" == "test" ]] && PROTECTED=false; \
	ERROR_DOCUMENT="index.html"; \
	WEBSITE_HOSTING="false" && [[ "${ENV}" == "prod" || "${ENV}" == "main" || "${ENV}" == "beta" || "${ENV}" == "test" ]] && WEBSITE_HOSTING=true; \
	URL=https://${FULL_DOMAIN_NAME}/index.html; \
	aws cloudformation deploy \
		--stack-name "ui-${ENV}" \
		--template-file ops/stacks/cloudfront.json \
		--region ${AWS_REGION} \
		--s3-bucket ${CF_BUCKET} \
		--no-fail-on-empty-changeset \
		--parameter-overrides \
			ServiceName="ui" \
			Environment="${ENV}" \
			ServiceDomain="${DOMAIN_NAME}" \
			CloudFrontKeyPairId="${CLOUDFRONT_KEYPAIR}" \
			CloudFrontPolicy="$$CLOUDFRONT_POLICY" \
			CloudFrontSignature="$$CLOUDFRONT_SIGNATURE" \
			WebsiteHosting="$$WEBSITE_HOSTING" \
			Protected="$$PROTECTED" \
			ErrorDocument="$$ERROR_DOCUMENT" \
		--capabilities CAPABILITY_IAM \
		$(CFN_TAGS) service-name=${SERVICE_NAME}; \
	echo "curl -v -H 'Cookie: CloudFront-Key-Pair-Id="${CLOUDFRONT_KEYPAIR}";CloudFront-Policy="$$CLOUDFRONT_POLICY";CloudFront-Signature="$$CLOUDFRONT_SIGNATURE";' $$URL"; \
