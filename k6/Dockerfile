FROM grafana/k6:latest

WORKDIR /tests

COPY tests/ .

# Padrão: load test. Sobrescreva com: docker run --rm k6-fakestore run smoke-test.js
ENTRYPOINT ["k6"]
CMD ["run", "load-test.js"]
