package com.projeto.carrinhoPraiagp02.controller;
import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import com.projeto.carrinhoPraiagp02.models.Mesa;
import com.projeto.carrinhoPraiagp02.service.MesaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.io.*;
import java.util.zip.*;

@RestController @RequestMapping("/api/mesas")
public class MesaController {
 private final MesaService service;
 public MesaController(MesaService service){this.service=service;}
 record Create(@Positive int numero){} record PublicMesa(Long id,Integer numero){}
 @GetMapping @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')") public java.util.List<Mesa> all(){return service.all();}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')") public Mesa create(@Valid @RequestBody Create in){return service.create(in.numero());}
 @GetMapping("/publico/{token}") public PublicMesa publicMesa(@PathVariable String token){Mesa m=service.token(token);return new PublicMesa(m.getId(),m.getNumero());}
 @GetMapping(value="/{id}/qrcode.png",produces="image/png") @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')") public byte[] png(@PathVariable Long id,HttpServletRequest req)throws Exception{return image(id,req);}
 @GetMapping(value="/qrcodes.zip",produces="application/zip") @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')") public ResponseEntity<byte[]> zip(HttpServletRequest req)throws Exception{ByteArrayOutputStream out=new ByteArrayOutputStream();try(ZipOutputStream zip=new ZipOutputStream(out)){for(Mesa m:service.all()){zip.putNextEntry(new ZipEntry("mesa-"+m.getNumero()+".png"));zip.write(image(m.getId(),req));zip.closeEntry();}}return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=mesas-qrcodes.zip").contentType(MediaType.parseMediaType("application/zip")).body(out.toByteArray());}
 private byte[] image(Long id,HttpServletRequest req)throws Exception{Mesa m=service.all().stream().filter(x->x.getId().equals(id)).findFirst().orElseThrow(()->new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND));var matrix=new QRCodeWriter().encode(service.target(m,req.getScheme()+"://"+req.getServerName()+(req.getServerPort()==80||req.getServerPort()==443?"":":"+req.getServerPort())),BarcodeFormat.QR_CODE,400,400);ByteArrayOutputStream out=new ByteArrayOutputStream();MatrixToImageWriter.writeToStream(matrix,"PNG",out);return out.toByteArray();}
}
