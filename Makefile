build:
	docker-compose build --no-cache --pull

up:
	docker-compose up -d

down:
	docker-compose down -v

setup:
	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

	brew install jq

	brew install volta

	volta install node@${shell jq -r '.volta.node' ./package.json}
	volta install pnpm@${shell jq -r '.volta.pnpm' ./package.json}

	pnpm install && pnpm build

	ln -s ${PWD}/.env ${PWD}/apps/game/.env
	ln -s ${PWD}/.env ${PWD}/apps/frontend/.env
	ln -s ${PWD}/.env ${PWD}/apps/backend/.env
