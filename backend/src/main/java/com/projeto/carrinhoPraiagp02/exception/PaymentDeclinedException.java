package com.projeto.carrinhoPraiagp02.exception;

public class PaymentDeclinedException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public PaymentDeclinedException() {
        super("Pagamento recusado. Tente outra forma de pagamento.");
    }
}
