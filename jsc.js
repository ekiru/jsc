importPackage(java.io, java.lang);

var prologue = 
  "\t.text\n" +
  ".globl _main\n" +
  "\t.pushl\t%ebp\n" +
  "\tmovl\t%esp, %ebp\n" +
  "\tsubl\t$8, %esp\n" +
  "\tmovl $0, %eax\n";

var epilogue = 
  "\tleave\n" +
  "\tret\n" +
  "\t.subsections_via_symbols\n";

function Compiler() {
  this.compile = function (expr) {
    System.out.print(prologue);
    
    System.out.print(epilogue);
  };
}
