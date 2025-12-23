import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { XANDSOL_STAKE_POOL } from '@/config/solana';

const STAKE_POOL_PROGRAM_ID = new PublicKey('SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy');

const STAKE_POOL_ADDRESS = new PublicKey(XANDSOL_STAKE_POOL.address);
const POOL_MINT = new PublicKey(XANDSOL_STAKE_POOL.poolMint);
const RESERVE_STAKE = new PublicKey(XANDSOL_STAKE_POOL.reserveStake);
const POOL_WITHDRAW_AUTHORITY = new PublicKey(XANDSOL_STAKE_POOL.poolWithdrawAuthority);
const MANAGER_FEE_ACCOUNT = new PublicKey(XANDSOL_STAKE_POOL.managerFeeAccount);

export interface StakeResult {
  success: boolean;
  signature?: string;
  error?: string;
  xandsolReceived?: number;
}

export interface UnstakeResult {
  success: boolean;
  signature?: string;
  error?: string;
  solReceived?: number;
}

function createDepositSolInstruction(
  stakePoolAddress: PublicKey,
  withdrawAuthority: PublicKey,
  reserveStake: PublicKey,
  depositorLamportsFrom: PublicKey,
  poolTokensTo: PublicKey,
  managerFeeAccount: PublicKey,
  referrerPoolTokensAccount: PublicKey,
  poolMint: PublicKey,
  lamports: number
): TransactionInstruction {
  const data = Buffer.alloc(9);
  data.writeUInt8(14, 0);
  data.writeBigUInt64LE(BigInt(lamports), 1);

  const keys = [
    { pubkey: stakePoolAddress, isSigner: false, isWritable: true },
    { pubkey: withdrawAuthority, isSigner: false, isWritable: false },
    { pubkey: reserveStake, isSigner: false, isWritable: true },
    { pubkey: depositorLamportsFrom, isSigner: true, isWritable: true },
    { pubkey: poolTokensTo, isSigner: false, isWritable: true },
    { pubkey: managerFeeAccount, isSigner: false, isWritable: true },
    { pubkey: referrerPoolTokensAccount, isSigner: false, isWritable: true },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: STAKE_POOL_PROGRAM_ID,
    keys,
    data,
  });
}

function createWithdrawSolInstruction(
  stakePoolAddress: PublicKey,
  withdrawAuthority: PublicKey,
  userTransferAuthority: PublicKey,
  poolTokensFrom: PublicKey,
  reserveStake: PublicKey,
  lamportsTo: PublicKey,
  managerFeeAccount: PublicKey,
  poolMint: PublicKey,
  poolTokens: number
): TransactionInstruction {
  const data = Buffer.alloc(9);
  data.writeUInt8(16, 0);
  data.writeBigUInt64LE(BigInt(poolTokens), 1);

  const keys = [
    { pubkey: stakePoolAddress, isSigner: false, isWritable: true },
    { pubkey: withdrawAuthority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: poolTokensFrom, isSigner: false, isWritable: true },
    { pubkey: reserveStake, isSigner: false, isWritable: true },
    { pubkey: lamportsTo, isSigner: false, isWritable: true },
    { pubkey: managerFeeAccount, isSigner: false, isWritable: true },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: STAKE_POOL_PROGRAM_ID,
    keys,
    data,
  });
}

export async function depositSol(
  connection: Connection,
  userPublicKey: PublicKey,
  amountSol: number,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<StakeResult> {
  try {
    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    const userPoolTokenAccount = await getAssociatedTokenAddress(
      POOL_MINT,
      userPublicKey
    );

    const transaction = new Transaction();

    try {
      await getAccount(connection, userPoolTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          userPublicKey,
          userPoolTokenAccount,
          userPublicKey,
          POOL_MINT
        )
      );
    }

    transaction.add(
      createDepositSolInstruction(
        STAKE_POOL_ADDRESS,
        POOL_WITHDRAW_AUTHORITY,
        RESERVE_STAKE,
        userPublicKey,
        userPoolTokenAccount,
        MANAGER_FEE_ACCOUNT,
        MANAGER_FEE_ACCOUNT,
        POOL_MINT,
        lamports
      )
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    const signedTx = await signTransaction(transaction);

    const signature = await connection.sendRawTransaction(signedTx.serialize());

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return {
      success: true,
      signature,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deposit SOL',
    };
  }
}

export async function withdrawSol(
  connection: Connection,
  userPublicKey: PublicKey,
  amountXandsol: number,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<UnstakeResult> {
  try {
    const poolTokens = Math.floor(amountXandsol * 1e9);

    const userPoolTokenAccount = await getAssociatedTokenAddress(
      POOL_MINT,
      userPublicKey
    );

    const transaction = new Transaction();

    transaction.add(
      createWithdrawSolInstruction(
        STAKE_POOL_ADDRESS,
        POOL_WITHDRAW_AUTHORITY,
        userPublicKey,
        userPoolTokenAccount,
        RESERVE_STAKE,
        userPublicKey,
        MANAGER_FEE_ACCOUNT,
        POOL_MINT,
        poolTokens
      )
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    const signedTx = await signTransaction(transaction);

    const signature = await connection.sendRawTransaction(signedTx.serialize());

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return {
      success: true,
      signature,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to withdraw SOL',
    };
  }
}

export async function getXandsolBalance(
  connection: Connection,
  userPublicKey: PublicKey
): Promise<number> {
  try {
    const userPoolTokenAccount = await getAssociatedTokenAddress(
      POOL_MINT,
      userPublicKey
    );

    const account = await getAccount(connection, userPoolTokenAccount);
    return Number(account.amount) / 1e9;
  } catch {
    return 0;
  }
}

export async function getSolBalance(
  connection: Connection,
  userPublicKey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(userPublicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}
